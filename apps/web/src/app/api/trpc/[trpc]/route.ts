import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@evanesc/api";
import type { Context } from "@evanesc/api";
import { db, users } from "@evanesc/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      let session: Context["session"] = null;

      try {
        const betterAuthSession = await auth.api.getSession({
          headers: req.headers,
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

      return { db, session };
    },
  });

export { handler as GET, handler as POST };
