import crypto from "crypto";

/**
 * Generates a secure 6-digit OTP
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes an OTP for secure storage
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Verifies an inputted OTP against a stored hash
 */
export const verifyOTP = (input: string, hash: string): boolean => {
  const inputHash = hashOTP(input);
  return inputHash === hash;
};
