import crypto from "crypto";

const PAYLOAD_SECRET =
  process.env.PAYLOAD_ENCRYPTION_KEY ||
  "empsphere_secure_payload_encryption_key_2026";

/**
 * Decrypts a client-encrypted payload (AES-256-GCM).
 * If the payload is unencrypted (e.g. legacy clients or test scripts), it safely returns the raw string.
 *
 * @param payload - Ciphertext in the format "enc:<iv_hex>:<cipher_hex>" or raw string
 * @returns Plaintext string
 */
export const decryptPassword = (payload: string): string => {
  if (!payload || typeof payload !== "string" || !payload.startsWith("enc:")) {
    return payload;
  }

  try {
    const parts = payload.split(":");
    if (parts.length !== 3) {
      return payload;
    }

    const key = crypto.createHash("sha256").update(PAYLOAD_SECRET).digest();
    const iv = Buffer.from(parts[1], "hex");
    const combined = Buffer.from(parts[2], "hex");

    if (combined.length < 16) {
      return payload;
    }

    // Last 16 bytes is the GCM authentication tag
    const tag = combined.subarray(combined.length - 16);
    const ciphertext = combined.subarray(0, combined.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    // If decryption fails (e.g. invalid format or tampered tag), return as-is
    return payload;
  }
};

/**
 * Decrypts an encrypted payload string or object.
 * If input is an object with a `data` field formatted as "enc:<iv>:<cipher>",
 * it decrypts the AES string, parses the JSON, and returns the resulting object.
 */
export const decryptPayload = <T = Record<string, unknown>>(body: unknown): T => {
  if (!body || typeof body !== "object") {
    return body as T;
  }

  const payloadObj = body as Record<string, unknown>;
  if (typeof payloadObj.data === "string") {
    const rawData = payloadObj.data.trim();
    if (rawData.startsWith("enc:")) {
      try {
        const decryptedStr = decryptPassword(rawData);
        return JSON.parse(decryptedStr) as T;
      } catch {
        return body as T;
      }
    }
  }

  return body as T;
};

