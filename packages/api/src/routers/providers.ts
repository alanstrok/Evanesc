import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { providers, users } from "@evanesc/db";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";

export const providersRouter = router({
  // Public: list verified providers
  list: publicProcedure
    .input(
      z
        .object({
          category: z
            .enum([
              "restaurants",
              "hotels",
              "villas",
              "spas",
              "water_sports",
              "excursions",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(providers.isVerified, true)];
      if (input?.category) {
        conditions.push(eq(providers.category, input.category) as any);
      }

      return ctx.db.query.providers.findMany({
        where: eq(providers.isVerified, true),
        orderBy: [desc(providers.createdAt)],
      });
    }),

  // Public: get single provider
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.providers.findFirst({
        where: eq(providers.id, input.id),
        with: {
          offers: {
            with: { slots: true },
          },
        },
      });
    }),

  // Authenticated: get my provider profile
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.providers.findFirst({
      where: eq(providers.userId, ctx.session.user.id),
    });
  }),

  // Authenticated: create or update provider profile
  upsertProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum([
          "restaurants",
          "hotels",
          "villas",
          "spas",
          "water_sports",
          "excursions",
        ]),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        address: z.string().optional(),
        instagram: z.string().optional(),
        website: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.providers.findFirst({
        where: eq(providers.userId, ctx.session.user.id),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(providers)
          .set(input)
          .where(eq(providers.id, existing.id))
          .returning();
        return updated;
      }

      // Update user role to provider
      await ctx.db
        .update(users)
        .set({ role: "provider" })
        .where(eq(users.id, ctx.session.user.id));

      const [provider] = await ctx.db
        .insert(providers)
        .values({
          userId: ctx.session.user.id,
          ...input,
        })
        .returning();

      return provider;
    }),

  // Admin: list all providers (including unverified)
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.providers.findMany({
      with: { user: true },
      orderBy: [desc(providers.createdAt)],
    });
  }),

  // Admin: verify/unverify a provider
  setVerified: adminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(providers)
        .set({ isVerified: input.isVerified })
        .where(eq(providers.id, input.providerId))
        .returning();
      return updated;
    }),
});
