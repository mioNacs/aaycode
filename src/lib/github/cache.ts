import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";
import { updateGitHubConnectionForUser } from "@/lib/users";

import type { GitHubStats } from "./api";
import { fetchGitHubStatsFromApi } from "./api";

const COLLECTION_NAME = "github_stats";

export type GitHubStatsDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  data: GitHubStats;
  lastUpdatedAt: Date;
};

const getCollection = async (): Promise<Collection<GitHubStatsDocument>> => {
  const client = await clientPromise;
  return client.db().collection<GitHubStatsDocument>(COLLECTION_NAME);
};

const parseStatsDocument = (doc: WithId<GitHubStatsDocument>): GitHubStatsDocument => ({
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

export const findGitHubStatsForUser = async (
  userId: string
): Promise<GitHubStatsDocument | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getCollection();
  const document = await collection.findOne({ userId: new ObjectId(userId) });

  return document ? parseStatsDocument(document) : null;
};

export const upsertGitHubStatsForUser = async (
  userId: string,
  stats: GitHubStats
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

export const deleteGitHubStatsForUser = async (userId: string): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getCollection();
  await collection.deleteOne({ userId: new ObjectId(userId) });
};

const HOURS_TO_MS = 60 * 60 * 1000;

export const getGitHubStatsForUser = async (
  userId: string,
  username: string,
  maxAgeHours = 12
): Promise<GitHubStats | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const cached = await findGitHubStatsForUser(userId);
  const isCachedFresh = cached
    ? Date.now() - cached.lastUpdatedAt.getTime() < maxAgeHours * HOURS_TO_MS &&
      cached.username.toLowerCase() === username.toLowerCase()
    : false;

  if (cached && isCachedFresh) {
    return cached.data;
  }

  const fresh = await fetchGitHubStatsFromApi(username);

  if (!fresh) {
    return cached ? cached.data : null;
  }

  await upsertGitHubStatsForUser(userId, fresh);

  await updateGitHubConnectionForUser(userId, {
    username: fresh.username,
    profileUrl: fresh.profileUrl,
    avatarUrl: fresh.avatarUrl,
    publicRepos: fresh.publicRepos,
    followers: fresh.followers,
    totalStars: fresh.totalStars,
    topLanguage: fresh.topLanguages[0]?.name,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};

export const refreshGitHubStatsForUser = async (
  userId: string,
  username: string
): Promise<GitHubStats | null> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const fresh = await fetchGitHubStatsFromApi(username);

  if (!fresh) {
    return null;
  }

  await upsertGitHubStatsForUser(userId, fresh);

  await updateGitHubConnectionForUser(userId, {
    username: fresh.username,
    profileUrl: fresh.profileUrl,
    avatarUrl: fresh.avatarUrl,
    publicRepos: fresh.publicRepos,
    followers: fresh.followers,
    totalStars: fresh.totalStars,
    topLanguage: fresh.topLanguages[0]?.name,
    lastSyncedAt: fresh.fetchedAt,
  });

  return fresh;
};
