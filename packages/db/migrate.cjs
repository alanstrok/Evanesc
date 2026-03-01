const { drizzle } = require("drizzle-orm/postgres-js");
const { migrate } = require("drizzle-orm/postgres-js/migrator");
const postgres = require("postgres");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://evanesc:evanesc@localhost:5432/evanesc";

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log("Running migrations...");
  await migrate(db, {
    migrationsFolder: process.env.MIGRATIONS_FOLDER || "./packages/db/drizzle",
  });
  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
