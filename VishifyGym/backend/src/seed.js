import 'dotenv/config';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import { seedUserExercises } from './utils/seedUser.js';

const email = process.argv[2]?.toLowerCase() || process.env.SEED_USER_EMAIL;
if (!email) {
  console.log('Usage: npm run seed -- you@example.com');
  process.exit(1);
}

await connectDatabase();
let [user] = await User.find({ email });
if (!user) {
  user = await User.create('Vishwajit', email, 'vishify-gym');
  console.log(`Created account for ${email} (password: vishify-gym — change it in production).`);
}
const seeded = await seedUserExercises(user._id);
console.log(`Seeded ${seeded} exercises for ${email}. No demo/progress data is ever created — only your real logs live in the tracker.`);
process.exit(0);