import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import { updateGeeksforgeeksConnectionForUser } from "../users";
import type { GeeksforgeeksStats } from "./api";
import { fetchGeeksforgeeksStatsFromApi } from "./api";

const COLLECTION_NAME = "geeksforgeeks_stats";

export type GeeksforgeeksStatsDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  data: GeeksforgeeksStats;
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<GeeksforgeeksStatsDocument>> => {
  const client = await clientPromise;
  return client.db().collection<GeeksforgeeksStatsDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<GeeksforgeeksStatsDocument>
): GeeksforgeeksStatsDocument => ({
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

export const findGeeksforgeeksStatsForUser = async (
  userId: string
): Promise<GeeksforgeeksStatsDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const record = await collection.findOne({ userId: new ObjectId(userId) });

  return record ? normalizeDocument(record) : null;
};

export const upsertGeeksforgeeksStatsForUser = async (
  userId: string,
  stats: GeeksforgeeksStats
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

export const deleteGeeksforgeeksStatsForUser = async (
  userId: string
): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  await collection.deleteOne({ userId: new ObjectId(userId) });
};

const HOURS_TO_MS = 60 * 60 * 1000;

export const getGeeksforgeeksStatsForUser = async (
  userId: string,
  username: string,
  maxAgeHours = 12
): Promise<GeeksforgeeksStats | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const cached = await findGeeksforgeeksStatsForUser(userId);
  const isFresh = cached
    ? Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS &&
      cached.username.toLowerCase() === username.toLowerCase()
    : false;

  if (cached && isFresh) {
    return cached.data;
  }

  const fresh = await fetchGeeksforgeeksStatsFromApi(username);

  if (!fresh) {
    return cached ? cached.data : null;
  }

  await upsertGeeksforgeeksStatsForUser(userId, fresh);

  await updateGeeksforgeeksConnectionForUser(userId, {
    username: fresh.username,
    codingScore: fresh.codingScore ?? undefined,
    totalProblemsSolved: fresh.totalProblemsSolved ?? undefined,
    instituteRank: fresh.instituteRank ?? undefined,
    schoolRank: fresh.schoolRank ?? undefined,
    streak: fresh.streak ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};

export const refreshGeeksforgeeksStatsForUser = async (
  userId: string,
  username: string
): Promise<GeeksforgeeksStats | null> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const fresh = await fetchGeeksforgeeksStatsFromApi(username);

  if (!fresh) {
    return null;
  }

  await upsertGeeksforgeeksStatsForUser(userId, fresh);

  await updateGeeksforgeeksConnectionForUser(userId, {
    username: fresh.username,
    codingScore: fresh.codingScore ?? undefined,
    totalProblemsSolved: fresh.totalProblemsSolved ?? undefined,
    instituteRank: fresh.instituteRank ?? undefined,
    schoolRank: fresh.schoolRank ?? undefined,
    streak: fresh.streak ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};
