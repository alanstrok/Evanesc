import { router, publicProcedure } from "../trpc";
import { paymentsEnabled } from "../lib/payments";

export const configRouter = router({
  get: publicProcedure.query(() => ({
    paymentsEnabled: paymentsEnabled(),
  })),
});
