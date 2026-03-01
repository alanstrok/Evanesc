import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@evanesc/api";
import type { Context } from "@evanesc/api";
import { db } from "@evanesc/db";
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

      return { db, session };
    },
  });

export { handler as GET, handler as POST };
