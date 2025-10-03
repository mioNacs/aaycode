import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { env } from "@/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION = 1;

const deriveKey = () => {
  const secret = env.nextAuth.secret;
  return createHash("sha256").update(secret).digest();
};

const KEY = deriveKey();

export const encryptSecret = (plainText: string): string => {
  if (!plainText) {
    throw new Error("Cannot encrypt empty secret");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([
    Buffer.from([VERSION]),
    iv,
    authTag,
    ciphertext,
  ]);

  return payload.toString("base64");
};

export const decryptSecret = (encoded: string): string | null => {
  try {
    const buffer = Buffer.from(encoded, "base64");

    if (buffer.length <= 1 + IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Encrypted payload too short");
    }

    const version = buffer.readUInt8(0);

    if (version !== VERSION) {
      throw new Error(`Unsupported secret version: ${version}`);
    }

    const iv = buffer.subarray(1, 1 + IV_LENGTH);
    const authTag = buffer.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[crypto] Failed to decrypt secret", error);
    return null;
  }
};
