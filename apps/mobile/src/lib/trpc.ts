import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@evanesc/api";

export const trpc = createTRPCReact<AppRouter>();
