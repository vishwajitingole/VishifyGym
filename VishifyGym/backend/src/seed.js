import 'dotenv/config';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import { seedDemoHistory, seedUserExercises } from './utils/seedUser.js';

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
const demo = await seedDemoHistory(user._id);
console.log(`Seeded ${seeded} exercises for ${email}.`);
if (demo) console.log(`Demo history added: ${demo.dailyLogs} daily logs, ${demo.workouts} workouts.`);
else console.log('Demo history skipped (data already present).');
process.exit(0);