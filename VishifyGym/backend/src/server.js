import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = process.env.PORT || 4000;

async function main() {
  try {
    await connectDatabase();
    app.listen(port, () => console.log(`Vishify Gym API listening on port ${port}`));
  } catch (error) {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
}

main();