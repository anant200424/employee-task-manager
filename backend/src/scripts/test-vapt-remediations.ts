import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User";
import Task from "../models/Task";
import jwt from "jsonwebtoken";
import { processBase64Image } from "../utils/fileUpload";

const API_BASE = "http://localhost:5000";

async function runVaptVerification() {
  console.log("==================================================");
  console.log("   VAPT REMEDIATION VERIFICATION SUITE            ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  await mongoose.connect(process.env.MONGO_URI as string);

  const admin = await User.findOne({ email: "anantsingh20334411@gmail.com" });
  if (!admin) {
    console.error("Admin user not found in DB.");
    process.exit(1);
  }

  // 1. Test OTP Auth Bypass is completely closed
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: admin.email,
        emailOtp: "000000",
        phoneOtp: "000000",
      }),
    });
    const body: any = await res.json();

    if (res.status === 400 && !body.data?.user) {
      console.log("✓ PASS: 1. Auth Bypass in verifyOtp is CLOSED (Returned 400 without issuing tokens)");
      passed++;
    } else {
      console.error("✗ FAIL: 1. Auth Bypass returned status", res.status, body);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 1. Exception:", err.message);
    failed++;
  }

  // 2. Test File Upload rejects SVG
  try {
    const fakeSvg = "data:image/svg+xml;base64," + Buffer.from("<svg><script>alert(1)</script></svg>").toString("base64");
    const result = processBase64Image(fakeSvg, "avatars", "test-svg");
    if (result === "") {
      console.log("✓ PASS: 2. Stored XSS prevention: SVG upload successfully rejected");
      passed++;
    } else {
      console.error("✗ FAIL: 2. SVG was accepted:", result);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 2. Exception:", err.message);
    failed++;
  }

  // 3. Test File Upload accepts clean PNG
  try {
    // 1x1 transparent PNG
    const pngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=";
    const result = processBase64Image(pngBase64, "avatars", "test-png");
    if (result.includes(".png")) {
      console.log("✓ PASS: 3. Legitimate raster image (PNG) accepted and stored safely");
      passed++;
    } else {
      console.error("✗ FAIL: 3. PNG was rejected:", result);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 3. Exception:", err.message);
    failed++;
  }

  // 4. Test AI Routes are mounted and protected
  try {
    const res = await fetch(`${API_BASE}/api/ai/context`);
    // Without token: 401 Unauthorized (proves route is mounted and protected)
    if (res.status === 401) {
      console.log("✓ PASS: 4. AI Routes mounted and protected under JWT middleware (HTTP 401)");
      passed++;
    } else {
      console.error("✗ FAIL: 4. Unexpected status for /api/ai/context:", res.status);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 4. Exception:", err.message);
    failed++;
  }

  // 5. Test AI Chat with Admin Token
  try {
    const token = jwt.sign(
      { userId: admin.id, role: admin.role },
      process.env.JWT_ACCESS_SECRET as string
    );
    const res = await fetch(`${API_BASE}/api/ai/context`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body: any = await res.json();

    if (res.status === 200 && body.data?.connected) {
      console.log("✓ PASS: 5. AI Copilot responds with company analytics for administrator (HTTP 200)");
      passed++;
    } else {
      console.error("✗ FAIL: 5. AI context failed with status", res.status, body);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 5. Exception:", err.message);
    failed++;
  }

  // 6. Test System Admin creation capability in tasks
  try {
    const employee = await User.findOne({ systemRole: "employee", isBlocked: { $ne: true } });
    const targetAssigneeId = employee ? employee.id : admin.id;

    const sysAdminToken = jwt.sign(
      { userId: admin.id, role: "System Administrator" },
      process.env.JWT_ACCESS_SECRET as string
    );

    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sysAdminToken}`,
      },
      body: JSON.stringify({
        title: "Security Verification Task",
        description: "Automated test deliverable",
        priority: "high",
        status: "todo",
        department: "Engineering",
        assignedTo: [targetAssigneeId],
      }),
    });
    const body: any = await res.json();

    if (res.status === 201 && body.data?.task?.taskCode) {
      console.log(`✓ PASS: 6. System Administrator successfully created task [${body.data.task.taskCode}] (HTTP 201)`);
      passed++;
      // Clean up test task
      await Task.findByIdAndDelete(body.data.task._id);
    } else {
      console.error("✗ FAIL: 6. System Admin task creation failed:", res.status, body);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 6. Exception:", err.message);
    failed++;
  }

  // 7. Test CORS rejects foreign unauthorized origin
  try {
    const res = await fetch(`${API_BASE}/`, {
      headers: { Origin: "https://malicious-attacker-site.com" },
    });

    const acao = res.headers.get("access-control-allow-origin");
    if (!acao || acao !== "https://malicious-attacker-site.com") {
      console.log("✓ PASS: 7. CORS policy blocks arbitrary origin reflection (No AC-Allow-Origin for attacker)");
      passed++;
    } else {
      console.error("✗ FAIL: 7. CORS reflected attacker origin:", acao);
      failed++;
    }
  } catch (err: any) {
    console.error("✗ FAIL: 7. Exception:", err.message);
    failed++;
  }

  await mongoose.disconnect();

  console.log("==================================================");
  console.log(`📊 RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runVaptVerification().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
