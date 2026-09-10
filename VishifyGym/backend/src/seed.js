import 'dotenv/config';
import { connectDatabase } from './config/db.js';
import Exercise from './models/Exercise.js';
import { EXERCISE_SEED } from './constants.js';

await connectDatabase();
for (const exercise of EXERCISE_SEED) {
  await Exercise.updateOne(
    { name: exercise.name, category: exercise.category },
    { $setOnInsert: exercise },
    { upsert: true }
  );
}
console.log(`Seeded ${EXERCISE_SEED.length} exercises without overwriting custom changes.`);
process.exit(0);
