import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import Task from '../models/Task';
import User from '../models/User';

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb+srv://anantsingh20334411_db_user:r0JD1tRZayx8aIxP@cluster0.3txsth7.mongodb.net/task_manager';
  await mongoose.connect(uri);
  const tasks = await Task.find({ isDeleted: { $ne: true } }).populate('assignedTo', 'firstName lastName role department email').populate('createdBy', 'firstName lastName role');
  console.log('ACTIVE_TASKS_COUNT:', tasks.length);

  const byDept: Record<string, number> = {};
  tasks.forEach(t => {
    byDept[t.department || 'Unassigned'] = (byDept[t.department || 'Unassigned'] || 0) + 1;
  });
  console.log('TASKS_BY_DEPT:', byDept);

  const managers = await User.find({
    $or: [
      { systemRole: 'manager' },
      { role: { $regex: /manager|lead|director|head/i } }
    ]
  }).select('firstName lastName email department role systemRole');
  console.log('MANAGERS_COUNT:', managers.length);
  console.log('MANAGERS:', JSON.stringify(managers, null, 2));

  // Check if any tasks have tags 'project' or 'initiative'
  const projectTasks = tasks.filter(t => t.tags && (t.tags.includes('project') || t.tags.includes('initiative')));
  console.log('PROJECT_TAGGED_TASKS:', projectTasks.length);

  process.exit(0);
}
run().catch(console.error);
