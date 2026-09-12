import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production-123456';
const token = jwt.sign({ id: '6a957baab658e45f068cdbda', role: 'admin', systemRole: 'admin' }, secret);

async function run() {
  try {
    const res = await axios.get('http://localhost:5000/api/users?includeAdmin=true', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS: status', res.status, 'users count:', res.data?.data?.users?.length);
  } catch (err: any) {
    console.error('ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

run();
