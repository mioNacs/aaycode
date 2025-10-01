import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import { updateCodechefConnectionForUser } from "../users";
import type { CodechefStats } from "./api";
import { fetchCodechefStatsFromApi } from "./api";

const COLLECTION_NAME = "codechef_stats";

export type CodechefStatsDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  data: CodechefStats;
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<CodechefStatsDocument>> => {
  const client = await clientPromise;
  return client.db().collection<CodechefStatsDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<CodechefStatsDocument>
): CodechefStatsDocument => ({
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

export const findCodechefStatsForUser = async (
  userId: string
): Promise<CodechefStatsDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const record = await collection.findOne({ userId: new ObjectId(userId) });

  return record ? normalizeDocument(record) : null;
};

export const upsertCodechefStatsForUser = async (
  userId: string,
  stats: CodechefStats
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

export const deleteCodechefStatsForUser = async (userId: string): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  await collection.deleteOne({ userId: new ObjectId(userId) });
};

const HOURS_TO_MS = 60 * 60 * 1000;

export const getCodechefStatsForUser = async (
  userId: string,
  username: string,
  maxAgeHours = 12
): Promise<CodechefStats | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const cached = await findCodechefStatsForUser(userId);
  const isFresh = cached
    ? Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS &&
      cached.username.toLowerCase() === username.toLowerCase()
    : false;

  if (cached && isFresh) {
    return cached.data;
  }

  const fresh = await fetchCodechefStatsFromApi(username);

  if (!fresh) {
    return cached ? cached.data : null;
  }

  await upsertCodechefStatsForUser(userId, fresh);

  await updateCodechefConnectionForUser(userId, {
    username: fresh.username,
    rating: fresh.rating ?? undefined,
    highestRating: fresh.highestRating ?? undefined,
    stars: fresh.stars ?? undefined,
    globalRank: fresh.globalRank ?? undefined,
    countryRank: fresh.countryRank ?? undefined,
    fullySolved: fresh.fullySolved ?? undefined,
    partiallySolved: fresh.partiallySolved ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};

export const refreshCodechefStatsForUser = async (
  userId: string,
  username: string
): Promise<CodechefStats | null> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const fresh = await fetchCodechefStatsFromApi(username);

  if (!fresh) {
    return null;
  }

  await upsertCodechefStatsForUser(userId, fresh);

  await updateCodechefConnectionForUser(userId, {
    username: fresh.username,
    rating: fresh.rating ?? undefined,
    highestRating: fresh.highestRating ?? undefined,
    stars: fresh.stars ?? undefined,
    globalRank: fresh.globalRank ?? undefined,
    countryRank: fresh.countryRank ?? undefined,
    fullySolved: fresh.fullySolved ?? undefined,
    partiallySolved: fresh.partiallySolved ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};
