import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("No MONGO_URI");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("No db");
    process.exit(1);
  }

  const tasksCollection = db.collection("tasks");
  const allTasks = await tasksCollection.find({}).toArray();
  console.log("Total tasks in DB:", allTasks.length);

  const satTasks = allTasks.filter((t) => {
    const d = new Date(t.createdAt).toISOString().slice(0, 10);
    return d === "2026-09-05";
  });

  console.log("Found Saturday bulk tasks:", satTasks.length);

  // Targets for Mon-Fri redistribution across realistic enterprise sprint
  const daysConfig = [
    { dateStr: "2026-09-07", hourBase: 9, maxCount: 58 },  // Mon
    { dateStr: "2026-09-08", hourBase: 10, maxCount: 66 }, // Tue
    { dateStr: "2026-09-09", hourBase: 11, maxCount: 61 }, // Wed
    { dateStr: "2026-09-03", hourBase: 13, maxCount: 48 }, // Thu
    { dateStr: "2026-09-04", hourBase: 14, maxCount: 32 }, // Fri
  ];

  let taskIdx = 0;
  for (const cfg of daysConfig) {
    const batch = satTasks.slice(taskIdx, taskIdx + cfg.maxCount);
    taskIdx += cfg.maxCount;

    for (let i = 0; i < batch.length; i++) {
      const task = batch[i];
      const hour = (cfg.hourBase + (i % 8)) % 24;
      const minute = (i * 7) % 60;
      const createdDate = new Date(`${cfg.dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);

      const updateDoc: any = { createdAt: createdDate };
      if (task.status === "completed") {
        const compDate = new Date(createdDate);
        compDate.setHours(compDate.getHours() + 18 + (i % 24));
        updateDoc.updatedAt = compDate;
      } else {
        updateDoc.updatedAt = createdDate;
      }

      await tasksCollection.updateOne({ _id: task._id }, { $set: updateDoc });
    }
  }

  // Also distribute some completed tasks' updatedAt across Mon-Fri to give a healthy completion curve
  const completedTasks = await tasksCollection.find({ status: "completed" }).toArray();
  console.log("Found total completed tasks:", completedTasks.length);
  for (let j = 0; j < completedTasks.length; j++) {
    const cTask = completedTasks[j];
    // Distribute completion timestamps mostly Tue, Wed, Thu, Fri (when deliverables are shipped!)
    const compDays = ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-03", "2026-09-04"];
    const chosenDay = compDays[j % compDays.length];
    const hour = 14 + (j % 5);
    const minute = (j * 11) % 60;
    const resolvedDate = new Date(`${chosenDay}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);
    await tasksCollection.updateOne({ _id: cTask._id }, { $set: { updatedAt: resolvedDate } });
  }

  // Verify resulting distribution
  const updatedTasks = await tasksCollection.find({}).toArray();
  const byDayCreated: Record<string, number> = {};
  const byDayCompleted: Record<string, number> = {};
  updatedTasks.forEach((t) => {
    const d = new Date(t.createdAt);
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    byDayCreated[day] = (byDayCreated[day] || 0) + 1;
    if (t.status === "completed") {
      const ud = new Date(t.updatedAt || t.createdAt);
      const cDay = ud.toLocaleDateString("en-US", { weekday: "short" });
      byDayCompleted[cDay] = (byDayCompleted[cDay] || 0) + 1;
    }
  });

  console.log("Updated Day-of-Week Created:", byDayCreated);
  console.log("Updated Day-of-Week Completed:", byDayCompleted);
  console.log("Rebalancing completed successfully!");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
