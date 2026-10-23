import { Pool } from "./db.js";
import { processDeletions } from "./deletion.js";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  console.log(await processDeletions(pool));
} finally {
  await pool.end();
}
