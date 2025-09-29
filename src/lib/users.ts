import type { Collection, Filter, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

export type UserDocument = {
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  hashedPassword?: string;
  username?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserWithId = WithId<UserDocument>;

const COLLECTION_NAME = "users";
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const getUsersCollection = async (): Promise<Collection<UserDocument>> => {
  const client = await clientPromise;
  return client.db().collection<UserDocument>(COLLECTION_NAME);
};

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export const isUsernameValid = (value: string): boolean => USERNAME_REGEX.test(value);

const sanitizeUsernameBase = (value: string): string =>
  normalizeUsername(value).replace(/[^a-z0-9_]/g, "");

const buildCaseInsensitiveFilter = (field: keyof UserDocument, value: string): Filter<UserDocument> => {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return {
    [field]: {
      $regex: new RegExp(`^${escaped}$`, "i"),
    },
  } as Filter<UserDocument>;
};

const usernameInUse = async (
  users: Collection<UserDocument>,
  username: string
): Promise<boolean> => {
  const filter = buildCaseInsensitiveFilter("username", username);
  const existing = await users.findOne(filter, { projection: { _id: 1 } });
  return Boolean(existing);
};

export const generateAvailableUsername = async (base: string): Promise<string> => {
  const users = await getUsersCollection();
  return generateAvailableUsernameWithCollection(base, users);
};

const generateAvailableUsernameWithCollection = async (
  base: string,
  users: Collection<UserDocument>
): Promise<string> => {
  let sanitized = sanitizeUsernameBase(base);

  if (!sanitized) {
    sanitized = "user";
  }

  if (sanitized.length < 3) {
    sanitized = sanitized.padEnd(3, "0");
  }

  sanitized = sanitized.slice(0, 20);

  if (!(await usernameInUse(users, sanitized))) {
    return sanitized;
  }

  const baseStem = sanitized.slice(0, 15);

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const suffix = attempt.toString();
    const truncatedStem = baseStem.slice(0, Math.max(3, 20 - suffix.length));
    const candidate = `${truncatedStem}${suffix}`;

    if (!(await usernameInUse(users, candidate))) {
      return candidate;
    }
  }

  while (true) {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${baseStem.slice(0, Math.max(3, 20 - randomSuffix.length))}${randomSuffix}`;

    if (!(await usernameInUse(users, candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique username");
};

export const findUserByEmail = async (email: string): Promise<UserWithId | null> => {
  const users = await getUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();

  const directMatch = await users.findOne({ email: normalizedEmail });
  if (directMatch) {
    return directMatch;
  }

  const filter = buildCaseInsensitiveFilter("email", normalizedEmail);
  return users.findOne(filter);
};

export const findUserById = async (id: string): Promise<UserWithId | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(id) });
};

export const findUserByUsername = async (username: string): Promise<UserWithId | null> => {
  const users = await getUsersCollection();
  const normalizedUsername = normalizeUsername(username);

  const directMatch = await users.findOne({ username: normalizedUsername });
  if (directMatch) {
    return directMatch;
  }

  const filter = buildCaseInsensitiveFilter("username", normalizedUsername);
  return users.findOne(filter);
};

export const updateUsernameForUser = async (
  userId: string,
  username: string
): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const users = await getUsersCollection();
  const normalizedUsername = normalizeUsername(username);

  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        username: normalizedUsername,
        updatedAt: new Date(),
      },
    }
  );
};

export const ensureUserHasUsername = async (
  userId: string,
  preferredName?: string | null,
  email?: string | null
): Promise<string | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const _id = new ObjectId(userId);
  const existingUser = await users.findOne({ _id });

  if (!existingUser) {
    return null;
  }

  if (existingUser.username) {
    return existingUser.username;
  }

  const nameBase = preferredName ? sanitizeUsernameBase(preferredName) : "";
  const emailBase = email ? sanitizeUsernameBase(email.split("@")[0] ?? "") : "";
  const fallbackBase = sanitizeUsernameBase(_id.toString().slice(-6));

  const availableUsername = await generateAvailableUsernameWithCollection(
    nameBase || emailBase || fallbackBase || "user",
    users
  );

  await users.updateOne(
    { _id },
    {
      $set: {
        username: availableUsername,
        updatedAt: new Date(),
      },
    }
  );

  return availableUsername;
};
