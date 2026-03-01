import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@evanesc/db";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  // Get current user session
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    return user ?? null;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.session.user.id))
        .returning();
      return updated;
    }),
});
