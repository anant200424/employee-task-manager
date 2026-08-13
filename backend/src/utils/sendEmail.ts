import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  // In development without SMTP credentials, log the email instead of failing the request.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n[Mailer] SMTP not configured — printing email instead of sending:");
    console.log(`To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"EmpSphere" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export const passwordResetEmailTemplate = (firstName: string, resetUrl: string): string => `
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
