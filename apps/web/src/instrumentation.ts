export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;

    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://evanesc:evanesc@localhost:5432/evanesc";

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    try {
      console.log("Running database migrations...");
      await migrate(db, { migrationsFolder: "./packages/db/drizzle" });
      console.log("Migrations complete.");
    } catch (err) {
      console.error("Migration failed:", err);
    } finally {
      await client.end();
    }
  }
}
