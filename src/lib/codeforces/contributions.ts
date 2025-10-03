import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  ensureRangeOrder,
  generateDateRange,
  toISODateString,
  type ServiceContributionSeries,
} from "../contributions";
import { CODEFORCES_API_ROOT, fetchJson } from "./api";

const COLLECTION_NAME = "codeforces_contributions";
const HOURS_TO_MS = 60 * 60 * 1000;
const SUBMISSIONS_PER_PAGE = 1000;
const MAX_SUBMISSION_PAGES = 30;

type CodeforcesSubmission = {
  id?: number;
  creationTimeSeconds?: number;
  verdict?: string;
};

type UserStatusResponse = {
  result: CodeforcesSubmission[];
};

export type CodeforcesContributionDay = {
  date: string;
  count: number;
};

export type CodeforcesContributionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  handle: string;
  year: number;
  samples: CodeforcesContributionDay[];
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<CodeforcesContributionDocument>> => {
  const client = await clientPromise;
  return client.db().collection<CodeforcesContributionDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<CodeforcesContributionDocument>
): CodeforcesContributionDocument => ({
  ...doc,
  lastUpdatedAt: doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
  samples: doc.samples.map((sample) => ({
    date: toISODateString(sample.date),
    count: sample.count ?? 0,
  })),
});

const buildUserStatusUrl = (handle: string, from: number, count: number): string => {
  const url = new URL(`${CODEFORCES_API_ROOT}/user.status`);
  url.searchParams.set("handle", handle);
  url.searchParams.set("from", from.toString());
  url.searchParams.set("count", count.toString());
  return url.toString();
};

const collectAcceptedSubmissionsForYear = async (
  handle: string,
  year: number
): Promise<Map<string, number> | null> => {
  const normalizedHandle = handle.trim();

  if (!normalizedHandle) {
    return null;
  }

  const values = new Map<string, number>();
  const startTimestamp = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const endTimestamp = Math.floor(Date.UTC(year, 11, 31, 23, 59, 59) / 1000);

  let from = 1;
  let pagesFetched = 0;
  let shouldStop = false;

  try {
    while (pagesFetched < MAX_SUBMISSION_PAGES) {
      const url = buildUserStatusUrl(normalizedHandle, from, SUBMISSIONS_PER_PAGE);
      const payload = await fetchJson<UserStatusResponse>(url);
      const submissions = payload.result ?? [];

      if (submissions.length === 0) {
        break;
      }

      for (const submission of submissions) {
        const timestamp = submission?.creationTimeSeconds;

        if (!Number.isFinite(timestamp)) {
          continue;
        }

        if (timestamp > endTimestamp) {
          // Submission is outside target year (future relative to requested year).
          continue;
        }

        if (timestamp < startTimestamp) {
          shouldStop = true;
          continue;
        }

        if (submission.verdict !== "OK") {
          continue;
        }

        const isoDate = toISODateString(new Date(timestamp * 1000));
        values.set(isoDate, (values.get(isoDate) ?? 0) + 1);
      }

      pagesFetched += 1;

      if (shouldStop || submissions.length < SUBMISSIONS_PER_PAGE) {
        break;
      }

      from += submissions.length;
    }
  } catch (error) {
    console.error(`[codeforces] Failed to fetch submissions for ${normalizedHandle} (${year})`, error);
    return null;
  }

  return values;
};

const convertValuesToSamples = (
  values: Map<string, number>,
  year: number
): CodeforcesContributionDay[] => {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  return generateDateRange(startOfYear, endOfYear).map((date) => ({
    date,
    count: values.get(date) ?? 0,
  }));
};

const fetchCalendarSamples = async (
  handle: string,
  year: number
): Promise<CodeforcesContributionDay[] | null> => {
  const values = await collectAcceptedSubmissionsForYear(handle, year);

  if (!values) {
    return null;
  }

  return convertValuesToSamples(values, year);
};

const findYearDocument = async (
  userId: string,
  year: number
): Promise<CodeforcesContributionDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const document = await collection.findOne({ userId: new ObjectId(userId), year });

  return document ? normalizeDocument(document) : null;
};

const upsertYearDocument = async (
  userId: string,
  handle: string,
  year: number,
  samples: CodeforcesContributionDay[]
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
        handle,
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

const getYearSamples = async (
  userId: string,
  handle: string,
  year: number,
  maxAgeHours: number
): Promise<CodeforcesContributionDay[] | null> => {
  const cached = await findYearDocument(userId, year);
  const cacheIsFresh = cached
    ? cached.handle.toLowerCase() === handle.toLowerCase() &&
      Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS
    : false;

  if (cached && cacheIsFresh) {
    return cached.samples;
  }

  const fresh = await fetchCalendarSamples(handle, year);

  if (!fresh) {
    return cached ? cached.samples : null;
  }

  await upsertYearDocument(userId, handle, year, fresh);
  return fresh;
};

const subsetRange = (
  samples: CodeforcesContributionDay[],
  start: string,
  end: string
): CodeforcesContributionDay[] => {
  const range = ensureRangeOrder(start, end);
  return samples.filter((sample) => sample.date >= range.start && sample.date <= range.end);
};

export const getCodeforcesContributionSeriesForUser = async (
  userId: string,
  handle: string,
  start: string,
  end: string,
  maxAgeHours = 6
): Promise<ServiceContributionSeries | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const range = ensureRangeOrder(start, end);
  const startYear = Number.parseInt(range.start.slice(0, 4), 10);
  const endYear = Number.parseInt(range.end.slice(0, 4), 10);

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return null;
  }

  const allSamples: CodeforcesContributionDay[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const samples = await getYearSamples(userId, handle, year, maxAgeHours);

    if (samples) {
      allSamples.push(...samples);
    }
  }

  if (allSamples.length === 0) {
    return null;
  }

  const filtered = subsetRange(allSamples, range.start, range.end);

  if (filtered.length === 0) {
    const zeros = generateDateRange(range.start, range.end).map((date) => ({
      date,
      count: 0,
    }));

    return {
      startDate: range.start,
      endDate: range.end,
      samples: zeros,
    };
  }

  return {
    startDate: range.start,
    endDate: range.end,
    samples: filtered,
  };
};
