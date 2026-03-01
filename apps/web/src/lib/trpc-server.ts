import { appRouter } from "@evanesc/api";
import { createCallerFactory, type Context } from "@evanesc/api/server";
import { db } from "@evanesc/db";
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
      session = {
        user: {
          id: betterAuthSession.user.id,
          email: betterAuthSession.user.email,
          name: betterAuthSession.user.name,
          role: (betterAuthSession.user as any).role ?? "customer",
        },
      };
    }
  } catch {
    // No session
  }

  return createCaller({ db, session });
}
