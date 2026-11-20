// Seeds a fresh database with the predefined rooms plus 2 admin and 4 test accounts.
//
//   npm run seed            # refuses to run if any users already exist
//   npm run seed -- --reset # drops users, messages and rooms first, then seeds
//
// Passwords are generated randomly and printed ONCE at the end. Nothing is stored in plain text.
import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Room from '../models/Room.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { predefinedRooms } from '../data/rooms.js';

const ACCOUNTS = [
  { name: 'Admin One', email: 'admin1@curiohub.test', role: 'admin', interests: [] },
  { name: 'Admin Two', email: 'admin2@curiohub.test', role: 'admin', interests: [] },
  { name: 'Test One', email: 'test1@curiohub.test', role: 'user', interests: ['Cricket', 'Football', 'Fitness'] },
  { name: 'Test Two', email: 'test2@curiohub.test', role: 'user', interests: ['Technology', 'AI & Machine Learning', 'Gaming'] },
  { name: 'Test Three', email: 'test3@curiohub.test', role: 'user', interests: ['Music', 'Cinema', 'Art'] },
  { name: 'Test Four', email: 'test4@curiohub.test', role: 'user', interests: [] }
];

// Unambiguous alphabet (no 0/O, 1/l/I), 18 chars is ~100 bits.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const generatePassword = (length = 18) =>
  Array.from(crypto.randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join('');

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set (server/.env).');
  process.exit(1);
}

const reset = process.argv.includes('--reset');

try {
  await mongoose.connect(process.env.MONGO_URI);
  const { host, name } = mongoose.connection;
  console.log(`Connected to ${host}/${name}`);

  const existing = await User.countDocuments();
  if (existing > 0 && !reset) {
    console.error(`Database already has ${existing} user(s). Re-run with --reset to wipe and reseed.`);
    process.exit(1);
  }
  if (reset) {
    await Promise.all([User.deleteMany({}), Message.deleteMany({}), Room.deleteMany({})]);
    console.log('Cleared users, messages and rooms.');
  }

  await Room.insertMany(predefinedRooms);
  console.log(`Seeded ${predefinedRooms.length} rooms.`);

  const created = [];
  for (const account of ACCOUNTS) {
    const password = generatePassword();
    await User.create({ ...account, password: await bcrypt.hash(password, 10) });
    created.push({ role: account.role, email: account.email, password });
  }

  console.log('\nAccounts (shown once, save them now):');
  console.table(created);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
