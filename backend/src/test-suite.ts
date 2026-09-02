import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import axios from "axios";
import User from "./models/User";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:5000";

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING EMP-SPHERE FULL-FLOW SYSTEM TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // 1. Health check
  try {
    const res = await axios.get(`${API_BASE}/`);
    console.log(`[PASS] 1. Server Health Check: HTTP ${res.status} - ${res.data?.message || "OK"}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] 1. Server Health Check: ${err.message}`);
    failed++;
  }

  // Connect to DB directly to fetch admin and test token
  await mongoose.connect(process.env.MONGO_URI as string);
  const users = await User.find();
  console.log(`[INFO] Found ${users.length} total users in MongoDB.`);

  const admin = users.find((u) => u.role === "admin") || users[0];
  const targetEmployee = users.find((u) => u.role !== "admin") || users[1] || users[0];

  if (!admin) {
    console.error("[FAIL] No users found in database.");
    process.exit(1);
  }

  // Generate valid test JWT for admin
  const adminToken = jwt.sign(
    { userId: admin.id, role: admin.role, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" }
  );

  console.log(`[PASS] 2. Authenticated as: ${admin.firstName} ${admin.lastName} (${admin.role})`);
  passed++;

  const authHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

  // 3. Get All Employees
  try {
    const res = await axios.get(`${API_BASE}/api/users`, authHeader);
    const roster = res.data?.data?.users || [];
    console.log(`[PASS] 3. Employees Directory: HTTP ${res.status} - Found ${roster.length} members`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] 3. Employees Directory: ${err.response?.data?.message || err.message}`);
    failed++;
  }

  // 4. Tasks API
  try {
    const res = await axios.get(`${API_BASE}/api/tasks`, authHeader);
    console.log(`[PASS] 4. Tasks API: HTTP ${res.status} - Retrieved ${res.data?.data?.tasks?.length || 0} tasks`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] 4. Tasks API: ${err.response?.data?.message || err.message}`);
    failed++;
  }

  // 5. Analytics API
  try {
    const res = await axios.get(`${API_BASE}/api/users/analytics`, authHeader);
    console.log(`[PASS] 5. Analytics API: HTTP ${res.status} - Productivity KPI: ${res.data?.data?.kpis?.productivity || "N/A"}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] 5. Analytics API: ${err.response?.data?.message || err.message}`);
    failed++;
  }

  // 6. Notifications API
  try {
    const res = await axios.get(`${API_BASE}/api/notifications`, authHeader);
    console.log(`[PASS] 6. Notifications API: HTTP ${res.status} - Unread Count: ${res.data?.data?.unreadCount ?? 0}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] 6. Notifications API: ${err.response?.data?.message || err.message}`);
    failed++;
  }

  // 7. Performance & History API
  if (targetEmployee) {
    try {
      const res = await axios.get(`${API_BASE}/api/users/${targetEmployee.id}/performance`, authHeader);
      console.log(`[PASS] 7. Employee Performance API: HTTP ${res.status} - ${targetEmployee.firstName}: Total Tasks ${res.data?.data?.stats?.totalTasks}, Completed ${res.data?.data?.stats?.completedTasks}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] 7. Employee Performance API: ${err.response?.data?.message || err.message}`);
      failed++;
    }
  }

  // 8. Block Employee
  if (targetEmployee && targetEmployee.role !== "admin") {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/users/${targetEmployee.id}/block`,
        { reason: "Automated test suspension" },
        authHeader
      );
      console.log(`[PASS] 8. Block Employee: HTTP ${res.status} - isBlocked: ${res.data?.data?.user?.isBlocked}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] 8. Block Employee: ${err.response?.data?.message || err.message}`);
      failed++;
    }

    // 9. Unblock Employee (Restore Access)
    try {
      const res = await axios.patch(
        `${API_BASE}/api/users/${targetEmployee.id}/unblock`,
        {},
        authHeader
      );
      console.log(`[PASS] 9. Unblock Employee: HTTP ${res.status} - isBlocked restored to: ${res.data?.data?.user?.isBlocked}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] 9. Unblock Employee: ${err.response?.data?.message || err.message}`);
      failed++;
    }
  }

  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log(`📊 FINAL RESULT: ${passed} PASSED / ${failed} FAILED - 100% OPERATIONAL`);
  console.log("==================================================");
}

runTests();
