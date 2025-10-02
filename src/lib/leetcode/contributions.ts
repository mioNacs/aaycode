import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  ensureRangeOrder,
  generateDateRange,
  toISODateString,
  type ServiceContributionSeries,
} from "../contributions";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
const USER_AGENT = "AyyCodeApp/1.0 (+https://github.com/mioNacs/aaycode)";

const calendarQuery = `
  query userProfileCalendar($username: String!, $year: Int) {
    userCalendar(username: $username, year: $year) {
      calendarData
    }
  }
`;

type CalendarResponse = {
  data?: {
    userCalendar?: {
      calendarData?: string | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
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

const parseCalendarData = (calendarData?: string | null): Map<string, number> => {
  const map = new Map<string, number>();

  if (!calendarData) {
    return map;
  }

  try {
    const parsed = JSON.parse(calendarData) as Record<string, number>;

    Object.entries(parsed).forEach(([timestamp, value]) => {
      const date = new Date(Number.parseInt(timestamp, 10) * 1000);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const iso = toISODateString(date);
      map.set(iso, Number.isFinite(value) ? value : 0);
    });
  } catch (error) {
    console.error("[leetcode] Failed to parse calendar data", error);
  }

  return map;
};

const fetchCalendarSamples = async (username: string, year: number): Promise<LeetCodeContributionDay[] | null> => {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  try {
    const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        query: calendarQuery,
        variables: {
          username: normalizedUsername,
          year,
        },
      }),
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LeetCode calendar request failed (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as CalendarResponse;

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message ?? "Unknown error").join(", "));
    }

    const calendarData = payload.data?.userCalendar?.calendarData;
    const values = parseCalendarData(calendarData);

    const startOfYear = toISODateString(new Date(Date.UTC(year, 0, 1)));
    const endOfYear = toISODateString(new Date(Date.UTC(year, 11, 31)));

    const samples = generateDateRange(startOfYear, endOfYear).map((date) => ({
      date,
      count: values.get(date) ?? 0,
    }));

    return samples;
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
