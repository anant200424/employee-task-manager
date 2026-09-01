import twilio from "twilio";
import { ApiError } from "../utils/ApiError";

/**
 * Service to handle dispatching SMS messages and verifying OTPs using Twilio Verify API.
 */

export const sendSms = async (to: string): Promise<void> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn(`[SMS Service] Missing Twilio Verify credentials. Simulated SMS sent to ${to}.`);
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to,
        channel: "sms",
      });
  } catch (error) {
    console.error("\n[SMS Service Error] Failed to send SMS via Twilio Verify:", error);
    if (process.env.NODE_ENV === "development") {
      console.warn(`[SMS Service Fallback] Twilio failed in development. Simulated SMS sent to ${to}.`);
      return;
    }
    throw new ApiError(500, "Failed to send SMS verification. Please ensure your phone number is correct.");
  }
};

export const verifySmsOtp = async (to: string, code: string): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn(`[SMS Service] Missing Twilio Verify credentials. Auto-verifying code ${code} for ${to}.`);
    // Fallback simulation for local development when keys aren't set
    return code.length === 6; 
  }

  try {
    const client = twilio(accountSid, authToken);
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to,
        code,
      });

    return verificationCheck.status === "approved";
  } catch (error: any) {
    console.error("\n[SMS Service Error] Failed to verify SMS OTP:", error);
    if (process.env.NODE_ENV === "development") {
      console.warn(`[SMS Service Fallback] Twilio Verify failed. Auto-approving code ${code} for development.`);
      return code.length === 6;
    }
    if (error.status === 404 || error.code === 20404) {
      throw new ApiError(400, "Verification session expired. Please request a new OTP.", { phoneOtp: "Expired OTP" });
    }
    throw new ApiError(500, "An error occurred while verifying the phone OTP.");
  }
};