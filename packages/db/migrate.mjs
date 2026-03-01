import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://evanesc:evanesc@localhost:5432/evanesc";

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log("Running migrations...");
await migrate(db, {
  migrationsFolder: process.env.MIGRATIONS_FOLDER || "./packages/db/drizzle",
});
console.log("Migrations complete.");
await client.end();
