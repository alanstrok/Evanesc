import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { offersRouter } from "./routers/offers";
import { bookingsRouter } from "./routers/bookings";
import { providersRouter } from "./routers/providers";
import { configRouter } from "./routers/config";

export const appRouter = router({
  auth: authRouter,
  offers: offersRouter,
  bookings: bookingsRouter,
  providers: providersRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;
