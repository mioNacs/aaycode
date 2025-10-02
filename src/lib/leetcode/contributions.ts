import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  ensureRangeOrder,
  generateDateRange,
  toISODateString,
  type ServiceContributionSeries,
} from "../contributions";
import { buildLeetCodeHeaders, LEETCODE_GRAPHQL_ENDPOINT } from "./client";

const progressCalendarQuery = `
  query userProgressCalendarV2($year: Int!, $month: Int!, $queryType: ProgressCalendarQueryTypeEnum!) {
    userProgressCalendarV2(year: $year, month: $month, queryType: $queryType) {
      dateSolvedInfoWithinMonth {
        date
        easySolvedNum
        mediumSolvedNum
        hardSolvedNum
      }
      dateSubmissionNumWithinMonth {
        date
        numSubmitted
      }
    }
  }
`;

const calendarQueryLegacy = `
  query userProfileCalendar($username: String!, $year: Int) {
    userProfileCalendar(username: $username, year: $year) {
      submissionCalendar
    }
  }
`;

type GraphQLError = { message?: string };

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

type ProgressSolvedEntry = {
  date: string;
  easySolvedNum: number;
  mediumSolvedNum: number;
  hardSolvedNum: number;
};

type ProgressSubmissionEntry = {
  date: string;
  numSubmitted: number;
};

type ProgressCalendarData = {
  userProgressCalendarV2?: {
    dateSolvedInfoWithinMonth?: ProgressSolvedEntry[];
    dateSubmissionNumWithinMonth?: ProgressSubmissionEntry[];
  } | null;
};


type LegacyCalendarData = {
  userProfileCalendar?: {
    submissionCalendar?: string | null;
  } | null;
};


type LeetCodeContributionDay = {
  date: string;
  count: number;
};

type LeetCodeContributionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  year: number;
  samples: LeetCodeContributionDay[];
  lastUpdatedAt: Date;
};

const COLLECTION_NAME = "leetcode_contributions";

const getCollection = async (): Promise<Collection<LeetCodeContributionDocument>> => {
  const client = await clientPromise;
  return client.db().collection<LeetCodeContributionDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<LeetCodeContributionDocument>
): LeetCodeContributionDocument => ({
  ...doc,
  lastUpdatedAt: doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
  samples: doc.samples.map((sample) => ({
    date: toISODateString(sample.date),
    count: sample.count ?? 0,
  })),
});

const parseSubmissionCalendar = (submissionCalendar?: string | null): Map<string, number> => {
  const map = new Map<string, number>();

  if (!submissionCalendar) {
    return map;
  }

  try {
    const parsed = JSON.parse(submissionCalendar) as Record<string, number>;

    Object.entries(parsed).forEach(([timestamp, value]) => {
      const date = new Date(Number.parseInt(timestamp, 10) * 1000);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const iso = toISODateString(date);
      map.set(iso, Number.isFinite(value) ? value : 0);
    });
  } catch (error) {
    console.error("[leetcode] Failed to parse submission calendar", error);
  }

  return map;
};

const executeGraphQL = async <T>(
  query: string,
  variables: Record<string, unknown>,
  operationName?: string,
  signal?: AbortSignal
): Promise<GraphQLResponse<T>> => {
  const body: Record<string, unknown> = { query, variables };

  if (operationName) {
    body.operationName = operationName;
  }

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: buildLeetCodeHeaders(),
    body: JSON.stringify(body),
    next: { revalidate: 60 * 60 },
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();

    if (response.status === 401 || response.status === 403) {
      console.warn(
        "[leetcode] Calendar request unauthorized. Ensure LEETCODE_SESSION/LEETCODE_CSRF_TOKEN env vars are set."
      );
    }

    throw new Error(`LeetCode calendar request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GraphQLResponse<T>;
};

const mergeProgressEntries = (
  values: Map<string, number>,
  solvedEntries?: ProgressSolvedEntry[],
  submissionEntries?: ProgressSubmissionEntry[]
): void => {
  solvedEntries?.forEach((entry) => {
    if (!entry?.date) {
      return;
    }

    const { easySolvedNum = 0, mediumSolvedNum = 0, hardSolvedNum = 0 } = entry;
    const total = easySolvedNum + mediumSolvedNum + hardSolvedNum;

    const iso = toISODateString(entry.date);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return;
    }

    values.set(iso, (values.get(iso) ?? 0) + total);
  });

  submissionEntries?.forEach((entry) => {
    if (!entry?.date) {
      return;
    }

    const iso = toISODateString(entry.date);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return;
    }

    if (!values.has(iso)) {
      values.set(iso, entry.numSubmitted ?? 0);
    }
  });
};

const fetchProgressCalendarValues = async (year: number): Promise<Map<string, number> | null> => {
  const values = new Map<string, number>();
  let sawResponse = false;

  for (let month = 1; month <= 12; month += 1) {
    try {
  const payload = await executeGraphQL<ProgressCalendarData>(
        progressCalendarQuery,
        {
          year,
          month,
          queryType: "SOLVED",
        },
        "userProgressCalendarV2"
      );

      if (payload.errors?.length) {
        const message = payload.errors.map((graphQLError) => graphQLError.message ?? "Unknown error").join(", ");
        throw new Error(message);
      }

      const calendar = payload.data?.userProgressCalendarV2;

      if (!calendar) {
        continue;
      }

      sawResponse = true;

      mergeProgressEntries(
        values,
        calendar.dateSolvedInfoWithinMonth,
        calendar.dateSubmissionNumWithinMonth
      );
    } catch (error) {
      console.error(`[leetcode] Failed to fetch progress calendar for ${year}-${month}`, error);
      return null;
    }
  }

  if (!sawResponse) {
    console.warn(
      "[leetcode] Progress calendar did not return any data. Ensure LEETCODE_SESSION/LEETCODE_CSRF_TOKEN env vars are set."
    );
    return null;
  }

  return values;
};

const fetchLegacyCalendarValues = async (
  username: string,
  year: number
): Promise<Map<string, number> | null> => {
  const payload = await executeGraphQL<LegacyCalendarData>(
    calendarQueryLegacy,
    {
      username,
      year,
    },
    "userProfileCalendar"
  );

  if (payload.errors?.length) {
    const message = payload.errors.map((graphQLError) => graphQLError.message ?? "Unknown error").join(", ");
    throw new Error(message);
  }

  const submissionCalendar = payload.data?.userProfileCalendar?.submissionCalendar;
  return parseSubmissionCalendar(submissionCalendar);
};

const convertValuesToSamples = (
  values: Map<string, number>,
  year: number
): LeetCodeContributionDay[] => {
  const startOfYear = toISODateString(new Date(Date.UTC(year, 0, 1)));
  const endOfYear = toISODateString(new Date(Date.UTC(year, 11, 31)));

  return generateDateRange(startOfYear, endOfYear).map((date) => ({
    date,
    count: values.get(date) ?? 0,
  }));
};

const fetchCalendarSamples = async (username: string, year: number): Promise<LeetCodeContributionDay[] | null> => {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  try {
    const progressValues = await fetchProgressCalendarValues(year);

    if (progressValues) {
      return convertValuesToSamples(progressValues, year);
    }

    const legacyValues = await fetchLegacyCalendarValues(normalizedUsername, year);

    if (legacyValues) {
      return convertValuesToSamples(legacyValues, year);
    }

    return null;
  } catch (error) {
    console.error("[leetcode] Failed to fetch calendar", error);
    return null;
  }
};

const findYearDocument = async (
  userId: string,
  year: number
): Promise<LeetCodeContributionDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const document = await collection.findOne({ userId: new ObjectId(userId), year });
  return document ? normalizeDocument(document) : null;
};

const upsertYearDocument = async (
  userId: string,
  username: string,
  year: number,
  samples: LeetCodeContributionDay[]
): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  const _id = new ObjectId(userId);

  await collection.updateOne(
    { userId: _id, year },
    {
      $set: {
        username,
        samples,
        lastUpdatedAt: new Date(),
      },
      $setOnInsert: {
        userId: _id,
        year,
      },
    },
    { upsert: true }
  );
};

const HOURS_TO_MS = 60 * 60 * 1000;

const getYearSamples = async (
  userId: string,
  username: string,
  year: number,
  maxAgeHours: number
): Promise<LeetCodeContributionDay[] | null> => {
  const cached = await findYearDocument(userId, year);
  const cacheIsFresh = cached
    ? cached.username.toLowerCase() === username.toLowerCase() &&
      Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS
    : false;

  if (cached && cacheIsFresh) {
    return cached.samples;
  }

  const fresh = await fetchCalendarSamples(username, year);

  if (!fresh) {
    return cached ? cached.samples : null;
  }

  await upsertYearDocument(userId, username, year, fresh);
  return fresh;
};

const subsetRange = (
  samples: LeetCodeContributionDay[],
  start: string,
  end: string
): LeetCodeContributionDay[] => {
  const range = ensureRangeOrder(start, end);
  return samples.filter((sample) => sample.date >= range.start && sample.date <= range.end);
};

export const getLeetCodeContributionSeriesForUser = async (
  userId: string,
  username: string,
  start: string,
  end: string,
  maxAgeHours = 12
): Promise<ServiceContributionSeries | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const targetRange = ensureRangeOrder(start, end);
  const startYear = Number.parseInt(targetRange.start.slice(0, 4), 10);
  const endYear = Number.parseInt(targetRange.end.slice(0, 4), 10);

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return null;
  }

  const allSamples: LeetCodeContributionDay[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const samples = await getYearSamples(userId, username, year, maxAgeHours);

    if (samples) {
      allSamples.push(...samples);
    }
  }

  if (allSamples.length === 0) {
    return null;
  }

  const filtered = subsetRange(allSamples, targetRange.start, targetRange.end);

  if (filtered.length === 0) {
    const zeros = generateDateRange(targetRange.start, targetRange.end).map((date) => ({
      date,
      count: 0,
    }));

    return {
      startDate: targetRange.start,
      endDate: targetRange.end,
      samples: zeros,
    };
  }

  return {
    startDate: targetRange.start,
    endDate: targetRange.end,
    samples: filtered,
  };
};
