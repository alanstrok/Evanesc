import { appRouter } from "@evanesc/api";
import { createCallerFactory, type Context } from "@evanesc/api/server";
import { db, users } from "@evanesc/db";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { headers } from "next/headers";

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  let session: Context["session"] = null;

  try {
    const betterAuthSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (betterAuthSession?.user) {
      // Fetch role directly from DB to ensure it's always correct
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, betterAuthSession.user.id),
        columns: { role: true },
      });
      session = {
        user: {
          id: betterAuthSession.user.id,
          email: betterAuthSession.user.email,
          name: betterAuthSession.user.name,
          role: dbUser?.role ?? "customer",
        },
      };
    }
  } catch {
    // No session
  }

  return createCaller({ db, session });
}
