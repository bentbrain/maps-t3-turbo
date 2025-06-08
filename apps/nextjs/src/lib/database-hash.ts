"server only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { env } from "@acme/env/env";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = env.NEXT_PRIVATE_DATABASE_HASH_SECRET;

// Ensure the secret key is exactly 32 bytes (256 bits)
function getKey(): Buffer {
  const key = Buffer.from(SECRET_KEY, "utf8");
  if (key.length === 32) {
    return key;
  } else if (key.length > 32) {
    return key.subarray(0, 32);
  } else {
    // Pad with zeros if too short
    const paddedKey = Buffer.alloc(32);
    key.copy(paddedKey);
    return paddedKey;
  }
}

/**
 * Encrypts userId and databaseId into a secure hash string
 */
export function encodeDatabaseParams(
  userId: string,
  databaseId: string,
): string {
  try {
    const key = getKey();
    const iv = randomBytes(16); // 128-bit IV for AES
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const data = JSON.stringify({ userId, databaseId });

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data
    const combined =
      iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;

    // Base64 encode for URL safety
    return Buffer.from(combined).toString("base64url");
  } catch (error) {
    console.error("Error encoding database params:", error);
    throw new Error("Failed to encode database parameters");
  }
}

/**
 * Decrypts a hash string back to userId and databaseId
 */
export function decodeDatabaseParams(hash: string): {
  userId: string;
  databaseId: string;
} {
  try {
    const key = getKey();

    // Base64 decode
    const combined = Buffer.from(hash, "base64url").toString();

    // Split the combined string
    const parts = combined.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid hash format");
    }

    const ivPart = parts[0];
    const authTagPart = parts[1];
    const encryptedPart = parts[2];

    if (!ivPart || !authTagPart || !encryptedPart) {
      throw new Error("Invalid hash format - missing parts");
    }

    const iv = Buffer.from(ivPart, "hex");
    const authTag = Buffer.from(authTagPart, "hex");
    const encrypted = encryptedPart;

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const parsed = JSON.parse(decrypted) as {
      userId: string;
      databaseId: string;
    };

    if (!parsed.userId || !parsed.databaseId) {
      throw new Error("Invalid decoded data");
    }

    return parsed;
  } catch (error) {
    console.error("Error decoding database params:", error);
    throw new Error("Failed to decode database parameters");
  }
}
