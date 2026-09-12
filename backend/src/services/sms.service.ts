import twilio from "twilio";

/**
 * Service to handle dispatching SMS messages and verifying OTPs using Twilio Verify API.
 */

export interface SendSmsResult {
  success: boolean;
  isTwilioTrialBlocked?: boolean;
  status?: string;
  error?: string;
}

export const sendSms = async (to: string): Promise<SendSmsResult> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn(`[SMS Service] Missing Twilio Verify credentials. Simulated SMS for ${to}.`);
    return { success: true, status: "simulated" };
  }

  try {
    const client = twilio(accountSid, authToken);
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to,
        channel: "sms",
      });
    console.log(`[SMS Service] Twilio SMS dispatched to ${to}. Status: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (error: any) {
    console.error("\n[SMS Service Error] Twilio Verify dispatch failed for", to, ":", error?.code, error?.message);
    const isTrialBlocked = error?.code === 21608 || error?.status === 400;
    if (isTrialBlocked) {
      console.warn(`[SMS Service Trial Notice] Recipient ${to} is unverified in Twilio Trial account. Activating fallback delivery.`);
    }
    return {
      success: false,
      isTwilioTrialBlocked: isTrialBlocked,
      error: error?.message,
    };
  }
};

export const verifySmsOtp = async (to: string, code: string): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn(`[SMS Service] Missing Twilio Verify credentials. Auto-verifying code ${code} for ${to}.`);
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
    console.error("\n[SMS Service Error] Failed to verify SMS OTP:", error?.code, error?.message);
    return false;
  }
};