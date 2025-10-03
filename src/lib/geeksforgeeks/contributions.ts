import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  ensureRangeOrder,
  generateDateRange,
  toISODateString,
  type ServiceContributionSeries,
} from "../contributions";
import {
  GFG_PROFILE_BASE_URL,
  USER_AGENT,
  extractNextData,
  getNested,
  isProfileMissing,
} from "./api";

const COLLECTION_NAME = "geeksforgeeks_contributions";

export type GeeksforgeeksContributionDay = {
  date: string;
  count: number;
};

export type GeeksforgeeksContributionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  year: number;
  samples: GeeksforgeeksContributionDay[];
  lastUpdatedAt: Date;
};

const HOURS_TO_MS = 60 * 60 * 1000;

const getCollection = async (): Promise<Collection<GeeksforgeeksContributionDocument>> => {
  const client = await clientPromise;
  return client.db().collection<GeeksforgeeksContributionDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<GeeksforgeeksContributionDocument>
): GeeksforgeeksContributionDocument => ({
  ...doc,
  lastUpdatedAt: doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
  samples: doc.samples.map((sample) => ({
    date: toISODateString(sample.date),
    count: sample.count ?? 0,
  })),
});

const buildProfileUrl = (username: string, year: number): string => {
  const base = new URL(`${encodeURIComponent(username)}/`, GFG_PROFILE_BASE_URL);

  if (Number.isFinite(year)) {
    base.searchParams.set("year", year.toString());
  }

  return base.toString();
};

const parseContributionSamples = (
  nextData: unknown,
  year: number
): GeeksforgeeksContributionDay[] | null => {
  const heatMapData = getNested(nextData, ["props", "pageProps", "heatMapData"]);

  if (!heatMapData || typeof heatMapData !== "object") {
    return null;
  }

  const heatMapRecord = heatMapData as Record<string, unknown>;
  const result = heatMapRecord.result;

  const contributions = new Map<string, number>();

  let sawMismatchedYear = false;

  if (result && typeof result === "object") {
    Object.entries(result as Record<string, unknown>).forEach(([date, value]) => {
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return;
      }

      const yearFromDate = Number.parseInt(date.slice(0, 4), 10);

      if (Number.isNaN(yearFromDate) || yearFromDate !== year) {
        sawMismatchedYear = true;
        return;
      }

      const numericValue =
        typeof value === "number"
          ? value
          : typeof value === "string"
          ? Number.parseInt(value, 10)
          : 0;

      if (!Number.isFinite(numericValue)) {
        return;
      }

      contributions.set(toISODateString(date), Math.max(0, Math.trunc(numericValue)));
    });
  }

  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;
  const dates = generateDateRange(startOfYear, endOfYear);

  if (contributions.size === 0 && sawMismatchedYear) {
    return null;
  }

  return dates.map((date) => ({
    date,
    count: contributions.get(date) ?? 0,
  }));
};

const fetchCalendarSamples = async (
  username: string,
  year: number
): Promise<GeeksforgeeksContributionDay[] | null> => {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  try {
    const url = buildProfileUrl(normalizedUsername, year);
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
      throw new Error(`GeeksforGeeks contribution request failed (${response.status}): ${body}`);
    }

    const html = await response.text();

    if (!html || isProfileMissing(html)) {
      return null;
    }

    const nextData = extractNextData(html);
    const samples = parseContributionSamples(nextData, year);

    return samples;
  } catch (error) {
    console.error(`[geeksforgeeks] Failed to fetch contributions for ${username} (${year})`, error);
    return null;
  }
};

const findYearDocument = async (
  userId: string,
  year: number
): Promise<GeeksforgeeksContributionDocument | null> => {
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
  samples: GeeksforgeeksContributionDay[]
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
): Promise<GeeksforgeeksContributionDay[] | null> => {
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
  samples: GeeksforgeeksContributionDay[],
  start: string,
  end: string
): GeeksforgeeksContributionDay[] => {
  const range = ensureRangeOrder(start, end);
  return samples.filter((sample) => sample.date >= range.start && sample.date <= range.end);
};

export const getGeeksforgeeksContributionSeriesForUser = async (
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

  const allSamples: GeeksforgeeksContributionDay[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const samples = await getYearSamples(userId, username, year, maxAgeHours);

    if (samples) {
      allSamples.push(...samples);
    }
  }

  if (allSamples.length === 0) {
    return null;
  }

  const filteredSamples = subsetRange(allSamples, normalizedRange.start, normalizedRange.end);

  if (filteredSamples.length === 0) {
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
    samples: filteredSamples,
  };
};
