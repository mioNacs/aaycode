import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import { updateLeetCodeConnectionForUser } from "../users";
import type { LeetCodeStats } from "./api";
import { fetchLeetCodeStatsFromApi } from "./api";

const COLLECTION_NAME = "leetcode_stats";

export type LeetCodeStatsDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  data: LeetCodeStats;
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<LeetCodeStatsDocument>> => {
  const client = await clientPromise;
  return client.db().collection<LeetCodeStatsDocument>(COLLECTION_NAME);
};

const normalizeStatsDocument = (
  doc: WithId<LeetCodeStatsDocument>
): LeetCodeStatsDocument => ({
  ...doc,
  data: {
    ...doc.data,
    fetchedAt:
      doc.data.fetchedAt instanceof Date
        ? doc.data.fetchedAt
        : new Date(doc.data.fetchedAt),
  },
  lastUpdatedAt:
    doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
});

export const findLeetCodeStatsForUser = async (
  userId: string
): Promise<LeetCodeStatsDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const record = await collection.findOne({ userId: new ObjectId(userId) });

  return record ? normalizeStatsDocument(record) : null;
};

export const upsertLeetCodeStatsForUser = async (
  userId: string,
  stats: LeetCodeStats
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
        username: stats.username,
        data: stats,
        lastUpdatedAt: stats.fetchedAt,
      },
      $setOnInsert: {
        userId: _id,
      },
    },
    { upsert: true }
  );
};

export const deleteLeetCodeStatsForUser = async (userId: string): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  await collection.deleteOne({ userId: new ObjectId(userId) });
};

const HOURS_TO_MS = 60 * 60 * 1000;

export const getLeetCodeStatsForUser = async (
  userId: string,
  username: string,
  maxAgeHours = 12
): Promise<LeetCodeStats | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const cached = await findLeetCodeStatsForUser(userId);
  const cacheIsFresh = cached
    ? Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS &&
      cached.username.toLowerCase() === username.toLowerCase()
    : false;

  if (cached && cacheIsFresh) {
    return cached.data;
  }

  const fresh = await fetchLeetCodeStatsFromApi(username);

  if (!fresh) {
    return cached ? cached.data : null;
  }

  await upsertLeetCodeStatsForUser(userId, fresh);

  await updateLeetCodeConnectionForUser(userId, {
    username: fresh.username,
    totalSolved: fresh.totalSolved,
    contestRating: fresh.contestRating ?? undefined,
    ranking: fresh.contestGlobalRanking ?? undefined,
    badges: fresh.badges ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};

export const refreshLeetCodeStatsForUser = async (
  userId: string,
  username: string
): Promise<LeetCodeStats | null> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const fresh = await fetchLeetCodeStatsFromApi(username);

  if (!fresh) {
    return null;
  }

  await upsertLeetCodeStatsForUser(userId, fresh);

  await updateLeetCodeConnectionForUser(userId, {
    username: fresh.username,
    totalSolved: fresh.totalSolved,
    contestRating: fresh.contestRating ?? undefined,
    ranking: fresh.contestGlobalRanking ?? undefined,
    badges: fresh.badges ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};
