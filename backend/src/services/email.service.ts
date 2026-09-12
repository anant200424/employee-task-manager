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

export const passwordResetOtpEmailTemplate = (
  firstName: string,
  otp: string,
): string => `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background:#F1F5F9;">
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; width:44px; height:44px; border-radius:50%; background:#1E293B; line-height:44px; color:#fff; font-weight:700; font-size:18px; box-shadow: 0 4px 12px rgba(67,85,204,0.3);">E</div>
  </div>
  <div style="background:#fff; border-radius:20px; padding:32px 28px; border: 1px solid #CBD5E1; box-shadow:0 4px 20px rgba(15,23,42,0.06);">
    <h2 style="color:#0F172A; font-size:22px; font-weight:700; margin-bottom:12px;">Reset your password</h2>
    <p style="color:#475569; font-size:14.5px; line-height:22px;">Hi ${firstName || "there"}, we received a request to reset your EmpSphere password. Use the 6-digit verification code below to proceed with resetting your password:</p>
    <div style="text-align:center; margin: 32px 0;">
      <div style="display:inline-block; letter-spacing:8px; font-family: monospace; background:#F8FAFC; color:#4355CC; padding:16px 32px; border-radius:14px; font-weight:800; font-size:32px; border: 2px dashed #4355CC;">${otp}</div>
    </div>
    <p style="color:#64748B; font-size:13px; margin-top:16px; text-align:center;">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
    <p style="color:#94A3B8; font-size:12px; margin-top:24px; text-align:center;">If you didn't request this password reset, you can safely ignore this email — your account remains completely secure.</p>
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

export const phoneChangeOtpEmailTemplate = (firstName: string, otp: string, newPhone: string): string => `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background:#F1F5F9;">
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; width:44px; height:44px; border-radius:50%; background:#1E293B; line-height:44px; color:#fff; font-weight:700; font-size:18px; box-shadow: 0 4px 12px rgba(67,85,204,0.3);">E</div>
  </div>
  <div style="background:#fff; border-radius:20px; padding:32px 28px; border: 1px solid #CBD5E1; box-shadow:0 4px 20px rgba(15,23,42,0.06);">
    <h2 style="color:#0F172A; font-size:22px; font-weight:700; margin-bottom:12px;">Verify Phone Number Change</h2>
    <p style="color:#475569; font-size:14.5px; line-height:22px;">Hi ${firstName}, we received a request to update your EmpSphere profile phone number to <strong>${newPhone}</strong>. Use the 6-digit verification code below to authorize this change:</p>
    <div style="text-align:center; margin: 32px 0;">
      <div style="display:inline-block; letter-spacing:8px; font-family: monospace; background:#F8FAFC; color:#4355CC; padding:16px 32px; border-radius:12px; font-weight:800; font-size:28px; border: 2px dashed #4355CC;">${otp}</div>
    </div>
    <p style="color:#64748B; font-size:13px; margin-top:16px;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
    <p style="color:#94A3B8; font-size:12px; margin-top:24px; text-align:center;">If you didn't initiate this request, please change your password immediately or contact your administrator.</p>
  </div>
</div>
`;

export interface AdminMessageEmailOptions {
  recipientName: string;
  senderName: string;
  senderRole?: string;
  senderEmail?: string;
  subject: string;
  message: string;
  priority?: "normal" | "important" | "urgent";
}

export const adminDirectMessageEmailTemplate = ({
  recipientName,
  senderName,
  senderRole = "Administrator",
  senderEmail,
  subject,
  message,
  priority = "normal",
}: AdminMessageEmailOptions): string => {
  // Format message lines with paragraph spacing
  const formattedMessage = message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin: 0 0 14px 0; color: #334155; font-size: 15px; line-height: 24px;">${line}</p>`)
    .join("");

  const priorityStyles = {
    urgent: {
      badgeBg: "#FEE2E2",
      badgeColor: "#DC2626",
      badgeBorder: "#FCA5A5",
      badgeText: "⚡ URGENT NOTICE",
      headerAccent: "#EF4444",
    },
    important: {
      badgeBg: "#FEF3C7",
      badgeColor: "#D97706",
      badgeBorder: "#FCD34D",
      badgeText: "📌 IMPORTANT NOTICE",
      headerAccent: "#F59E0B",
    },
    normal: {
      badgeBg: "#EEF2FF",
      badgeColor: "#4338CA",
      badgeBorder: "#C7D2FE",
      badgeText: "✉️ OFFICIAL DIRECT MESSAGE",
      headerAccent: "#5B5FEF",
    },
  }[priority] || {
    badgeBg: "#EEF2FF",
    badgeColor: "#4338CA",
    badgeBorder: "#C7D2FE",
    badgeText: "✉️ OFFICIAL DIRECT MESSAGE",
    headerAccent: "#5B5FEF",
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 16px;">
    <!-- Brand Banner -->
    <div style="background: #0F172A; border-radius: 20px 20px 0 0; padding: 24px 28px; text-align: left; border-bottom: 3px solid ${priorityStyles.headerAccent};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="display: inline-block; width: 34px; height: 34px; border-radius: 10px; background: #5B5FEF; color: #FFFFFF; font-weight: 800; font-size: 17px; line-height: 34px; text-align: center; box-shadow: 0 4px 10px rgba(91,95,239,0.4);">E</span>
              <span style="color: #FFFFFF; font-size: 19px; font-weight: 800; margin-left: 10px; letter-spacing: -0.5px; vertical-align: middle;">EmpSphere</span>
            </div>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span style="display: inline-block; background: ${priorityStyles.badgeBg}; color: ${priorityStyles.badgeColor}; border: 1px solid ${priorityStyles.badgeBorder}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
              ${priorityStyles.badgeText}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Card Body -->
    <div style="background: #FFFFFF; border-radius: 0 0 20px 20px; padding: 32px 28px; border: 1px solid #CBD5E1; border-top: none; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
      <!-- Subject Header -->
      <h1 style="color: #0F172A; font-size: 21px; font-weight: 800; line-height: 28px; margin: 0 0 16px 0;">
        ${subject}
      </h1>

      <p style="color: #64748B; font-size: 14px; margin: 0 0 20px 0; font-weight: 500;">
        Dear <strong>${recipientName}</strong>,
      </p>

      <!-- Message Content Box -->
      <div style="background: #F8FAFC; border-left: 4px solid ${priorityStyles.headerAccent}; border-radius: 4px 14px 14px 4px; padding: 20px 22px; margin-bottom: 26px;">
        ${formattedMessage}
      </div>

      <!-- Sender Information Strip -->
      <div style="background: #F1F5F9; border-radius: 14px; padding: 14px 18px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <p style="margin: 0; color: #64748B; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Dispatched By</p>
              <p style="margin: 2px 0 0 0; color: #0F172A; font-size: 14px; font-weight: 700;">
                ${senderName} <span style="color: #64748B; font-weight: 500; font-size: 12.5px;">(${senderRole})</span>
              </p>
              ${senderEmail ? `<p style="margin: 2px 0 0 0; color: #5B5FEF; font-size: 12px; font-weight: 500;">${senderEmail}</p>` : ""}
            </td>
            <td align="right" style="vertical-align: middle;">
              <p style="margin: 0; color: #94A3B8; font-size: 11.5px; font-weight: 600;">
                ${formattedDate}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Footer / Disclaimer -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center;">
        <p style="color: #94A3B8; font-size: 11.5px; line-height: 18px; margin: 0 0 6px 0;">
          This email was sent to <strong>${recipientName}</strong> through the EmpSphere Administration Portal via SMTP.
        </p>
        <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
          &copy; ${new Date().getFullYear()} EmpSphere Enterprise Workforce Management. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export interface TaskAssignmentEmailOptions {
  recipientName: string;
  assignerName: string;
  taskCode: string;
  taskTitle: string;
  taskDescription?: string;
  priority: string;
  dueDate: Date | string;
  department?: string;
  clientUrl?: string;
}

export const taskAssignmentEmailTemplate = ({
  recipientName,
  assignerName,
  taskCode,
  taskTitle,
  taskDescription,
  priority = "medium",
  dueDate,
  department = "Engineering",
  clientUrl = process.env.CLIENT_URL || "http://localhost:3000",
}: TaskAssignmentEmailOptions): string => {
  const priorityColors: Record<string, { bg: string; color: string; border: string; label: string }> = {
    urgent: { bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5", label: "⚡ URGENT" },
    high: { bg: "#FFEDD5", color: "#EA580C", border: "#FDBA74", label: "🔥 HIGH" },
    medium: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "📌 MEDIUM" },
    low: { bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1", label: "☕ LOW" },
  };

  const pConfig = priorityColors[priority.toLowerCase()] || priorityColors.medium;
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Not specified";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assigned: ${taskCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 16px;">
    <!-- Brand Banner -->
    <div style="background: #0F172A; border-radius: 20px 20px 0 0; padding: 24px 28px; border-bottom: 3px solid #5B5FEF;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="display: inline-block; width: 34px; height: 34px; border-radius: 10px; background: #5B5FEF; color: #FFFFFF; font-weight: 800; font-size: 17px; line-height: 34px; text-align: center;">E</span>
              <span style="color: #FFFFFF; font-size: 19px; font-weight: 800; margin-left: 10px; vertical-align: middle;">EmpSphere</span>
            </div>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span style="display: inline-block; background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
              TASK ASSIGNMENT
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Card Body -->
    <div style="background: #FFFFFF; border-radius: 0 0 20px 20px; padding: 32px 28px; border: 1px solid #CBD5E1; border-top: none; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
      <h1 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 14px 0;">
        You have been assigned a new task
      </h1>

      <p style="color: #64748B; font-size: 14.5px; margin: 0 0 22px 0;">
        Hi <strong>${recipientName}</strong>, <strong>${assignerName}</strong> has assigned a new task to you in the EmpSphere workspace.
      </p>

      <!-- Task Details Box -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px 22px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
          <tr>
            <td align="left">
              <span style="font-family: monospace; font-size: 12px; font-weight: 800; background: #0F172A; color: #FFFFFF; padding: 4px 10px; border-radius: 6px;">
                ${taskCode}
              </span>
            </td>
            <td align="right">
              <span style="background: ${pConfig.bg}; color: ${pConfig.color}; border: 1px solid ${pConfig.border}; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px;">
                ${pConfig.label}
              </span>
            </td>
          </tr>
        </table>

        <h2 style="color: #0F172A; font-size: 17px; font-weight: 700; margin: 0 0 10px 0; line-height: 24px;">
          ${taskTitle}
        </h2>

        ${taskDescription ? `<p style="color: #475569; font-size: 13.5px; line-height: 21px; margin: 0 0 16px 0;">${taskDescription}</p>` : ""}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px dashed #CBD5E1; padding-top: 12px; font-size: 12.5px;">
          <tr>
            <td style="color: #64748B; padding: 4px 0;">Due Date:</td>
            <td align="right" style="color: #0F172A; font-weight: 700; padding: 4px 0;">${formattedDueDate}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 4px 0;">Department:</td>
            <td align="right" style="color: #0F172A; font-weight: 700; padding: 4px 0;">${department}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 24px 0;">
        <a href="${clientUrl}/tasks" style="display: inline-block; background: #5B5FEF; color: #FFFFFF; text-decoration: none; padding: 13px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(91,95,239,0.35);">
          Open Workspace & View Task &rarr;
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 18px; text-align: center;">
        <p style="color: #94A3B8; font-size: 11.5px; margin: 0 0 4px 0;">
          Assigned by ${assignerName} via EmpSphere Enterprise Task Management.
        </p>
        <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
          &copy; ${new Date().getFullYear()} EmpSphere. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export interface AccountBlockedEmailOptions {
  recipientName: string;
  reason?: string;
  employeeId?: string;
}

export const accountBlockedEmailTemplate = ({
  recipientName,
  reason = "Administrative suspension by manager",
  employeeId = "EMP",
}: AccountBlockedEmailOptions): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspension Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 16px;">
    <!-- Brand Banner -->
    <div style="background: #0F172A; border-radius: 20px 20px 0 0; padding: 24px 28px; border-bottom: 3px solid #EF4444;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="display: inline-block; width: 34px; height: 34px; border-radius: 10px; background: #EF4444; color: #FFFFFF; font-weight: 800; font-size: 17px; line-height: 34px; text-align: center;">E</span>
              <span style="color: #FFFFFF; font-size: 19px; font-weight: 800; margin-left: 10px; vertical-align: middle;">EmpSphere</span>
            </div>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span style="display: inline-block; background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
              ⚡ ACCESS SUSPENDED
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Card Body -->
    <div style="background: #FFFFFF; border-radius: 0 0 20px 20px; padding: 32px 28px; border: 1px solid #CBD5E1; border-top: none; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
      <h1 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 14px 0;">
        EmpSphere Account Access Notice
      </h1>

      <p style="color: #475569; font-size: 14.5px; line-height: 22px; margin: 0 0 20px 0;">
        Dear <strong>${recipientName}</strong>, this is an official notification to inform you that your EmpSphere account access (ID: <strong>${employeeId}</strong>) has been temporarily suspended by the administration team.
      </p>

      <!-- Suspension Detail Box -->
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px 14px 14px 4px; padding: 18px 20px; margin-bottom: 22px;">
        <p style="margin: 0 0 6px 0; color: #991B1B; font-size: 12px; font-weight: 800; text-transform: uppercase;">Reason for Suspension</p>
        <p style="margin: 0; color: #B91C1C; font-size: 14px; font-weight: 600; line-height: 20px;">${reason}</p>
      </div>

      <p style="color: #64748B; font-size: 13.5px; line-height: 21px; margin: 0 0 20px 0;">
        During this suspension period, you will be unable to log in to the company portal, view tasks, or access internal workplace documents.
      </p>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #475569; font-size: 12.5px; line-height: 19px;">
          <strong>Next Steps:</strong> If you believe this action was made in error, or if you need to submit documentation regarding this suspension, please reach out directly to your HR Representative or Department Administrator.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 18px; text-align: center;">
        <p style="color: #94A3B8; font-size: 11.5px; margin: 0 0 4px 0;">
          Dispatched automatically by EmpSphere Security & Administrative Access Controls.
        </p>
        <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
          &copy; ${new Date().getFullYear()} EmpSphere Enterprise Workforce Management.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export interface AccountUnblockedEmailOptions {
  recipientName: string;
  employeeId?: string;
  clientUrl?: string;
}

export const accountUnblockedEmailTemplate = ({
  recipientName,
  employeeId = "EMP",
  clientUrl = process.env.CLIENT_URL || "http://localhost:3000",
}: AccountUnblockedEmailOptions): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Access Restored</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 16px;">
    <!-- Brand Banner -->
    <div style="background: #0F172A; border-radius: 20px 20px 0 0; padding: 24px 28px; border-bottom: 3px solid #10B981;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <div style="display: inline-block; vertical-align: middle;">
              <span style="display: inline-block; width: 34px; height: 34px; border-radius: 10px; background: #10B981; color: #FFFFFF; font-weight: 800; font-size: 17px; line-height: 34px; text-align: center;">E</span>
              <span style="color: #FFFFFF; font-size: 19px; font-weight: 800; margin-left: 10px; vertical-align: middle;">EmpSphere</span>
            </div>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span style="display: inline-block; background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
              ✓ ACCESS RESTORED
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Card Body -->
    <div style="background: #FFFFFF; border-radius: 0 0 20px 20px; padding: 32px 28px; border: 1px solid #CBD5E1; border-top: none; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
      <h1 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 14px 0;">
        Welcome back to EmpSphere
      </h1>

      <p style="color: #475569; font-size: 14.5px; line-height: 22px; margin: 0 0 20px 0;">
        Dear <strong>${recipientName}</strong>, we are pleased to inform you that your EmpSphere employee account access (ID: <strong>${employeeId}</strong>) has been fully restored by the administrator.
      </p>

      <div style="background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 4px 14px 14px 4px; padding: 18px 20px; margin-bottom: 24px;">
        <p style="margin: 0; color: #065F46; font-size: 13.5px; font-weight: 600; line-height: 20px;">
          Your workspace privileges, task access, and profile services are now fully active.
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 24px 0;">
        <a href="${clientUrl}/login" style="display: inline-block; background: #10B981; color: #FFFFFF; text-decoration: none; padding: 13px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(16,185,129,0.35);">
          Login to EmpSphere Portal &rarr;
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 18px; text-align: center;">
        <p style="color: #94A3B8; font-size: 11.5px; margin: 0 0 4px 0;">
          Dispatched automatically by EmpSphere Security & Administrative Access Controls.
        </p>
        <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
          &copy; ${new Date().getFullYear()} EmpSphere Enterprise Workforce Management.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;


