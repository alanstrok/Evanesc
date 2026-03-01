import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { offersRouter } from "./routers/offers";
import { bookingsRouter } from "./routers/bookings";
import { providersRouter } from "./routers/providers";

export const appRouter = router({
  auth: authRouter,
  offers: offersRouter,
  bookings: bookingsRouter,
  providers: providersRouter,
});

export type AppRouter = typeof appRouter;
