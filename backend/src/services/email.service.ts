import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: EmailOptions): Promise<void> => {
  const isDummyConfig =
    process.env.SMTP_USER?.trim() === "your_email@gmail.com" ||
    !process.env.SMTP_USER?.trim() ||
    !process.env.SMTP_PASS?.trim();

  // In development without real SMTP credentials, log the email instead of failing the request.
  if (isDummyConfig) {
    console.log("\n=======================================================");
    console.log(
      "[Mailer] SMTP not configured — printing email instead of sending:",
    );
    console.log(
      `To: ${to}\nSubject: ${subject}\n\n${html.replace(/<[^>]+>/g, "")}`,
    ); // Strip HTML tags for readable console output
    console.log("=======================================================\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"EmpSphere" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("\n[Mailer Error] Failed to send email:", error);
    if (process.env.NODE_ENV === "development") {
      console.log("\n=======================================================");
      console.log("[Mailer Fallback] SMTP sending failed, printed instead:");
      console.log(`To: ${to}\nSubject: ${subject}\n\n${html.replace(/<[^>]+>/g, "")}`);
      console.log("=======================================================\n");
      return;
    }
    // Since this is critical for OTP, we should throw the error so the caller knows it failed
    throw new Error(
      "Could not send email. Please check your SMTP configuration.",
    );
  }
};

export const passwordResetEmailTemplate = (
  firstName: string,
  resetUrl: string,
): string => `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background:#F1F5F9;">
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; width:44px; height:44px; border-radius:50%; background:#1E293B; line-height:44px; color:#fff; font-weight:700; font-size:18px; box-shadow: 0 4px 12px rgba(67,85,204,0.3);">E</div>
  </div>
  <div style="background:#fff; border-radius:20px; padding:32px 28px; border: 1px solid #CBD5E1; box-shadow:0 4px 20px rgba(15,23,42,0.06);">
    <h2 style="color:#0F172A; font-size:22px; font-weight:700; margin-bottom:12px;">Reset your EmpSphere password</h2>
    <p style="color:#475569; font-size:14.5px; line-height:22px;">Hi ${firstName}, we received a request to reset your EmpSphere account password. This link expires in 30 minutes.</p>
    <div style="text-align:center; margin: 24px 0;">
      <a href="${resetUrl}" style="display:inline-block; background:#4355CC; color:#fff; text-decoration:none; padding:12px 28px; border-radius:12px; font-weight:600; font-size:14px; box-shadow:0 4px 14px rgba(67,85,204,0.35);">Reset Password</a>
    </div>
    <p style="color:#94A3B8; font-size:12px; margin-top:24px; text-align:center;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
  </div>
</div>
`;

export const otpVerificationEmailTemplate = (otp: string): string => `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background:#F1F5F9;">
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; width:44px; height:44px; border-radius:50%; background:#1E293B; line-height:44px; color:#fff; font-weight:700; font-size:18px; box-shadow: 0 4px 12px rgba(67,85,204,0.3);">E</div>
  </div>
  <div style="background:#fff; border-radius:20px; padding:32px 28px; border: 1px solid #CBD5E1; box-shadow:0 4px 20px rgba(15,23,42,0.06);">
    <h2 style="color:#0F172A; font-size:22px; font-weight:700; margin-bottom:12px;">Verify your email address</h2>
    <p style="color:#475569; font-size:14.5px; line-height:22px;">Welcome to EmpSphere! Please use the following 6-digit verification code to complete your registration. This code expires in 5 minutes.</p>
    <div style="text-align:center; margin: 32px 0;">
      <div style="display:inline-block; letter-spacing:8px; font-family: monospace; background:#F8FAFC; color:#0F172A; padding:16px 32px; border-radius:12px; font-weight:700; font-size:28px; border: 1px dashed #CBD5E1;">${otp}</div>
    </div>
    <p style="color:#94A3B8; font-size:12px; margin-top:24px; text-align:center;">If you did not attempt to register an EmpSphere account, you can safely ignore this email.</p>
  </div>
</div>
`;
