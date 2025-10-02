import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import {
  fetchGitHubContributionTimelineFromApi,
  fetchGitHubContributionTimelineFromGraphql,
  type GitHubContributionDay,
} from "./api";
import { ensureRangeOrder, toISODateString, type ServiceContributionSeries } from "../contributions";
import { findProviderAccessToken } from "../accounts";

const COLLECTION_NAME = "github_contributions";

export type GitHubContributionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  range: {
    start: string;
    end: string;
  };
  samples: GitHubContributionDay[];
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<GitHubContributionDocument>> => {
  const client = await clientPromise;
  return client.db().collection<GitHubContributionDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<GitHubContributionDocument>
): GitHubContributionDocument => ({
  ...doc,
  lastUpdatedAt:
    doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
});

export const findGitHubContributionSeriesForUser = async (
  userId: string
): Promise<GitHubContributionDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const document = await collection.findOne({ userId: new ObjectId(userId) });
  return document ? normalizeDocument(document) : null;
};

const upsertGitHubContributionSeriesForUser = async (
  userId: string,
  username: string,
  range: { start: string; end: string },
  samples: GitHubContributionDay[]
): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  const _id = new ObjectId(userId);

  await collection.updateOne(
    { userId: _id },
    {
      $set: {
        username,
        range,
        samples,
        lastUpdatedAt: new Date(),
      },
      $setOnInsert: {
        userId: _id,
      },
    },
    { upsert: true }
  );
};

const HOURS_TO_MS = 60 * 60 * 1000;

const subsetSamples = (
  samples: GitHubContributionDay[],
  start: string,
  end: string
): GitHubContributionDay[] => {
  const { start: normalizedStart, end: normalizedEnd } = ensureRangeOrder(start, end);
  return samples.filter((sample) => sample.date >= normalizedStart && sample.date <= normalizedEnd);
};

const todayIso = () => toISODateString(new Date());

export const getGitHubContributionSeriesForUser = async (
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
  const cached = await findGitHubContributionSeriesForUser(userId);
  const cachedHasSamples = Boolean(cached?.samples?.length);
  const cacheIsUsable = cached
    ? cachedHasSamples &&
      cached.username.toLowerCase() === username.toLowerCase() &&
      cached.range.start <= targetRange.start &&
      cached.range.end >= targetRange.end &&
      Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS
    : false;

  if (cached && cacheIsUsable) {
    return {
      startDate: targetRange.start,
      endDate: targetRange.end,
      samples: subsetSamples(cached.samples, targetRange.start, targetRange.end),
    };
  }

  const today = todayIso();
  const fetchRange = {
    start: targetRange.start,
    end: targetRange.end > today ? today : targetRange.end,
  };

  const accessToken = await findProviderAccessToken({ userId, provider: "github" });

  let samples: GitHubContributionDay[] | null = null;

  if (accessToken) {
    samples = await fetchGitHubContributionTimelineFromGraphql(username, accessToken, fetchRange);
  }

  if (!samples || samples.length === 0) {
    samples = await fetchGitHubContributionTimelineFromApi(username, fetchRange);
  }

  if (!samples || samples.length === 0) {
    if (cached) {
      return {
        startDate: targetRange.start,
        endDate: targetRange.end,
        samples: subsetSamples(cached.samples, targetRange.start, targetRange.end),
      };
    }

    return null;
  }

  await upsertGitHubContributionSeriesForUser(userId, username, targetRange, samples);

  return {
    startDate: targetRange.start,
    endDate: targetRange.end,
    samples,
  };
};
