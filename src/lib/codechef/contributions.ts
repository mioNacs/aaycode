import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  ensureRangeOrder,
  generateDateRange,
  toISODateString,
  type ServiceContributionSeries,
} from "../contributions";
import { CODECHEF_PROFILE_BASE_URL, USER_AGENT, isProfileMissing } from "./api";

const COLLECTION_NAME = "codechef_contributions";
const HOURS_TO_MS = 60 * 60 * 1000;

type UserDailySubmissionStat = {
  date?: string;
  value?: number | string | null;
};

export type CodechefContributionDay = {
  date: string;
  count: number;
};

export type CodechefContributionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  year: number;
  samples: CodechefContributionDay[];
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<CodechefContributionDocument>> => {
  const client = await clientPromise;
  return client.db().collection<CodechefContributionDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<CodechefContributionDocument>
): CodechefContributionDocument => ({
  ...doc,
  lastUpdatedAt: doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
  samples: doc.samples.map((sample) => ({
    date: toISODateString(sample.date),
    count: sample.count ?? 0,
  })),
});

const buildProfileUrl = (username: string): string => {
  return `${CODECHEF_PROFILE_BASE_URL}${encodeURIComponent(username)}`;
};

const normalizeRawDate = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = parts;
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const isoYear = `${year}`.padStart(4, "0");
  const isoMonth = `${month}`.padStart(2, "0");
  const isoDay = `${day}`.padStart(2, "0");

  return `${isoYear}-${isoMonth}-${isoDay}`;
};

const normalizeCount = (value: number | string | null | undefined): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }

  return null;
};

const parseSubmissionStats = (html: string): Map<string, number> | null => {
  const match = html.match(/var\s+userDailySubmissionsStats\s*=\s*(\[[\s\S]*?\]);/);

  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]) as UserDailySubmissionStat[];
    const values = new Map<string, number>();

    parsed.forEach((entry) => {
      const isoDate = normalizeRawDate(entry.date ?? null);
      const count = normalizeCount(entry.value ?? null);

      if (!isoDate || count === null) {
        return;
      }

      values.set(isoDate, (values.get(isoDate) ?? 0) + count);
    });

    return values;
  } catch (error) {
    console.error("[codechef] Failed to parse submission stats", error);
    return null;
  }
};

const fetchSubmissionStats = async (username: string): Promise<Map<string, number> | null> => {
  const url = buildProfileUrl(username);
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    const body = await response.text();
    throw new Error(`CodeChef contribution request failed (${response.status}): ${body}`);
  }

  const html = await response.text();

  if (!html || isProfileMissing(html)) {
    return null;
  }

  return parseSubmissionStats(html);
};

const convertValuesToYearSamples = (
  values: Map<string, number>,
  year: number
): CodechefContributionDay[] => {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  return generateDateRange(startOfYear, endOfYear).map((date) => ({
    date,
    count: values.get(date) ?? 0,
  }));
};

const fetchCalendarSamples = async (
  username: string,
  year: number
): Promise<CodechefContributionDay[] | null> => {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  try {
    const values = await fetchSubmissionStats(normalizedUsername);

    if (!values) {
      return null;
    }

    return convertValuesToYearSamples(values, year);
  } catch (error) {
    console.error(`[codechef] Failed to fetch contributions for ${username} (${year})`, error);
    return null;
  }
};

const findYearDocument = async (
  userId: string,
  year: number
): Promise<CodechefContributionDocument | null> => {
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
  samples: CodechefContributionDay[]
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

const getYearSamples = async (
  userId: string,
  username: string,
  year: number,
  maxAgeHours: number
): Promise<CodechefContributionDay[] | null> => {
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
  samples: CodechefContributionDay[],
  start: string,
  end: string
): CodechefContributionDay[] => {
  const range = ensureRangeOrder(start, end);
  return samples.filter((sample) => sample.date >= range.start && sample.date <= range.end);
};

export const getCodechefContributionSeriesForUser = async (
  userId: string,
  username: string,
  start: string,
  end: string,
  maxAgeHours = 12
): Promise<ServiceContributionSeries | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const normalizedRange = ensureRangeOrder(start, end);
  const startYear = Number.parseInt(normalizedRange.start.slice(0, 4), 10);
  const endYear = Number.parseInt(normalizedRange.end.slice(0, 4), 10);

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return null;
  }

  const allSamples: CodechefContributionDay[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const samples = await getYearSamples(userId, username, year, maxAgeHours);

    if (samples) {
      allSamples.push(...samples);
    }
  }

  if (allSamples.length === 0) {
    return null;
  }

  const filtered = subsetRange(allSamples, normalizedRange.start, normalizedRange.end);

  if (filtered.length === 0) {
    const zeros = generateDateRange(normalizedRange.start, normalizedRange.end).map((date) => ({
      date,
      count: 0,
    }));

    return {
      startDate: normalizedRange.start,
      endDate: normalizedRange.end,
      samples: zeros,
    };
  }

  return {
    startDate: normalizedRange.start,
    endDate: normalizedRange.end,
    samples: filtered,
  };
};
