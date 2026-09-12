import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import Task from '../models/Task';
import User from '../models/User';

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb+srv://anantsingh20334411_db_user:r0JD1tRZayx8aIxP@cluster0.3txsth7.mongodb.net/task_manager';
  await mongoose.connect(uri);
  const userCount = await User.countDocuments();
  const taskCount = await Task.countDocuments();
  console.log('USERS_COUNT:', userCount);
  console.log('TASKS_COUNT:', taskCount);
  const tasks = await Task.find({}).select('taskCode title department priority status assignedTo createdBy').limit(10);
  console.log('SAMPLE_TASKS:', JSON.stringify(tasks, null, 2));
  const depts = await Task.distinct('department');
  console.log('TASK_DEPTS:', depts);
  const userDepts = await User.distinct('department');
  console.log('USER_DEPTS:', userDepts);
  const users = await User.find({}).select('firstName lastName email role systemRole department');
  console.log('SAMPLE_USERS:', JSON.stringify(users.slice(0, 10), null, 2));
  process.exit(0);
}
check().catch(console.error);
