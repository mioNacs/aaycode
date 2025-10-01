import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import { updateCodeforcesConnectionForUser } from "../users";
import type { CodeforcesStats } from "./api";
import { fetchCodeforcesStatsFromApi } from "./api";

const COLLECTION_NAME = "codeforces_stats";

export type CodeforcesStatsDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  handle: string;
  data: CodeforcesStats;
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<CodeforcesStatsDocument>> => {
  const client = await clientPromise;
  return client.db().collection<CodeforcesStatsDocument>(COLLECTION_NAME);
};

const normalizeDocument = (
  doc: WithId<CodeforcesStatsDocument>
): CodeforcesStatsDocument => ({
  ...doc,
  data: {
    ...doc.data,
    fetchedAt:
      doc.data.fetchedAt instanceof Date
        ? doc.data.fetchedAt
        : new Date(doc.data.fetchedAt),
    lastContestDate:
      doc.data.lastContestDate instanceof Date
        ? doc.data.lastContestDate
        : doc.data.lastContestDate
        ? new Date(doc.data.lastContestDate)
        : null,
  },
  lastUpdatedAt:
    doc.lastUpdatedAt instanceof Date ? doc.lastUpdatedAt : new Date(doc.lastUpdatedAt),
});

export const findCodeforcesStatsForUser = async (
  userId: string
): Promise<CodeforcesStatsDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const record = await collection.findOne({ userId: new ObjectId(userId) });

  return record ? normalizeDocument(record) : null;
};

export const upsertCodeforcesStatsForUser = async (
  userId: string,
  stats: CodeforcesStats
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
        handle: stats.handle,
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

export const deleteCodeforcesStatsForUser = async (userId: string): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  await collection.deleteOne({ userId: new ObjectId(userId) });
};

const HOURS_TO_MS = 60 * 60 * 1000;

export const getCodeforcesStatsForUser = async (
  userId: string,
  handle: string,
  maxAgeHours = 12
): Promise<CodeforcesStats | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const cached = await findCodeforcesStatsForUser(userId);
  const isFresh = cached
    ? Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS &&
      cached.handle.toLowerCase() === handle.toLowerCase()
    : false;

  if (cached && isFresh) {
    return cached.data;
  }

  const fresh = await fetchCodeforcesStatsFromApi(handle);

  if (!fresh) {
    return cached ? cached.data : null;
  }

  await upsertCodeforcesStatsForUser(userId, fresh);

  await updateCodeforcesConnectionForUser(userId, {
    handle: fresh.handle,
    rating: fresh.rating ?? undefined,
    maxRating: fresh.maxRating ?? undefined,
    rank: fresh.rank ?? undefined,
    lastContestAt: fresh.lastContestDate ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};

export const refreshCodeforcesStatsForUser = async (
  userId: string,
  handle: string
): Promise<CodeforcesStats | null> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const fresh = await fetchCodeforcesStatsFromApi(handle);

  if (!fresh) {
    return null;
  }

  await upsertCodeforcesStatsForUser(userId, fresh);

  await updateCodeforcesConnectionForUser(userId, {
    handle: fresh.handle,
    rating: fresh.rating ?? undefined,
    maxRating: fresh.maxRating ?? undefined,
    rank: fresh.rank ?? undefined,
    lastContestAt: fresh.lastContestDate ?? undefined,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};
