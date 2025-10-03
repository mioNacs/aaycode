import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";

import clientPromise from "@/dbConfig/dbConfig";

import { decryptSecret, encryptSecret } from "./security/crypto";

const COLLECTION_NAME = "accounts";

type OAuthAccountDocument = {
  userId: ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  scope?: string | null;
  tokenType?: string | null;
  expiresAt?: number | null;
  accessTokenEncrypted?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const getAccountsCollection = async (): Promise<Collection<OAuthAccountDocument>> => {
  const client = await clientPromise;
  return client.db().collection<OAuthAccountDocument>(COLLECTION_NAME);
};

type UpsertProviderAccessTokenInput = {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken: string;
  scope?: string | null;
  tokenType?: string | null;
  expiresAt?: number | null;
};

export const upsertProviderAccessToken = async ({
  userId,
  provider,
  providerAccountId,
  accessToken,
  scope,
  tokenType,
  expiresAt,
}: UpsertProviderAccessTokenInput): Promise<string> => {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const collection = await getAccountsCollection();
  const userObjectId = new ObjectId(userId);
  const encryptedToken = encryptSecret(accessToken);
  const now = new Date();

  await collection.updateOne(
    { userId: userObjectId, provider, providerAccountId },
    {
      $set: {
        accessTokenEncrypted: encryptedToken,
        scope: scope ?? null,
        tokenType: tokenType ?? null,
        expiresAt: expiresAt ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: userObjectId,
        provider,
        providerAccountId,
        type: "oauth",
        createdAt: now,
      },
      $unset: {
        access_token: "",
        refresh_token: "",
      },
    } as Record<string, unknown>,
    { upsert: true }
  );

  return encryptedToken;
};

type ProviderTokenLookup = {
  userId: string;
  provider: string;
};

export const findProviderAccessToken = async ({
  userId,
  provider,
}: ProviderTokenLookup): Promise<string | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getAccountsCollection();
  const account = await collection.findOne(
    { userId: new ObjectId(userId), provider },
    { projection: { accessTokenEncrypted: 1 } }
  );

  if (!account?.accessTokenEncrypted) {
    return null;
  }

  return decryptSecret(account.accessTokenEncrypted);
};

export const sanitizeProviderAccessToken = async ({
  userId,
  provider,
  providerAccountId,
}: {
  userId: string;
  provider: string;
  providerAccountId: string;
}): Promise<void> => {
  if (!ObjectId.isValid(userId)) {
    return;
  }

  const collection = await getAccountsCollection();
  await collection.updateOne(
    { userId: new ObjectId(userId), provider, providerAccountId },
    {
      $unset: {
        access_token: "",
        refresh_token: "",
      },
    }
  );
};