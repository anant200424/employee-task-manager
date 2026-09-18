/**
 * Client-Side Payload Security Utility
 * 
 * Uses hardware-accelerated Web Crypto API (AES-256-GCM) to mask sensitive
 * fields like passwords before transmission, preventing plaintext exposure
 * in browser DevTools Network tabs and inspection tools.
 */

const PAYLOAD_SECRET =
  process.env.NEXT_PUBLIC_PAYLOAD_KEY ||
  "empsphere_secure_payload_encryption_key_2026";

/**
 * Encrypts a password or sensitive string for transmission.
 * Returns format: "enc:<iv_hex>:<ciphertext_hex>"
 * If Web Crypto is unavailable (e.g. non-browser environment), falls back to plain string.
 *
 * @param plain - The plaintext password string
 * @returns Encrypted string or original plaintext if unsupported
 */
export const encryptPassword = async (plain: string): Promise<string> => {
  if (!plain || typeof plain !== "string") return plain;

  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return plain;
  }

  try {
    const encoder = new TextEncoder();
    const rawKey = await window.crypto.subtle.digest(
      "SHA-256",
      encoder.encode(PAYLOAD_SECRET)
    );

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuf = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encoder.encode(plain)
    );

    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const cipherHex = Array.from(new Uint8Array(encryptedBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `enc:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error("Payload encryption fallback:", err);
    return plain;
  }
};

/**
 * Encrypts an entire data object or payload (AES-256-GCM).
 * Returns format: "enc:<iv_hex>:<ciphertext_hex>"
 * Used to wrap the entire request body under a single { data } key.
 *
 * @param payload - Any serializable object or primitive
 * @returns Encrypted string
 */
export const encryptPayload = async (payload: unknown): Promise<string> => {
  if (payload === null || payload === undefined) return "";
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
  return encryptPassword(serialized);
};

