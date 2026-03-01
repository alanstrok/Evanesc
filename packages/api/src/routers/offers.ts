import { z } from "zod";
import { eq, and, desc, gte, gt, sql, lte } from "drizzle-orm";
import { offers, offerSlots, providers } from "@evanesc/db";
import {
  router,
  publicProcedure,
  providerProcedure,
} from "../trpc";

export const offersRouter = router({
  // Public: list active offers with visible slots
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
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { category, limit = 20, offset = 0 } = input ?? {};
      const now = new Date();

      const conditions = [eq(offers.isActive, true)];
      if (category) {
        conditions.push(eq(offers.category, category));
      }

      const results = await ctx.db.query.offers.findMany({
        where: and(...conditions),
        with: {
          provider: true,
          slots: {
            where: and(
              lte(offerSlots.visibleFrom, now),
              gt(offerSlots.expiresAt, now),
              gt(offerSlots.remainingSpots, 0),
            ),
          },
        },
        orderBy: [desc(offers.createdAt)],
        limit,
        offset,
      });

      // Only return offers that have visible slots
      return results.filter((offer) => offer.slots.length > 0);
    }),

  // Public: get single offer by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const offer = await ctx.db.query.offers.findFirst({
        where: eq(offers.id, input.id),
        with: {
          provider: true,
          slots: {
            where: and(
              lte(offerSlots.visibleFrom, now),
              gt(offerSlots.expiresAt, now),
              gt(offerSlots.remainingSpots, 0),
            ),
          },
        },
      });
      return offer ?? null;
    }),

  // Provider: list own offers
  myOffers: providerProcedure.query(async ({ ctx }) => {
    const provider = await ctx.db.query.providers.findFirst({
      where: eq(providers.userId, ctx.session.user.id),
    });
    if (!provider) return [];

    return ctx.db.query.offers.findMany({
      where: eq(offers.providerId, provider.id),
      with: { slots: true },
      orderBy: [desc(offers.createdAt)],
    });
  }),

  // Provider: create offer
  create: providerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        normalPrice: z.string(),
        dealPrice: z.string(),
        category: z.enum([
          "restaurants",
          "hotels",
          "villas",
          "spas",
          "water_sports",
          "excursions",
        ]),
        images: z.array(z.string()).default([]),
        visibilityHours: z.number().min(1).default(48),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.query.providers.findFirst({
        where: eq(providers.userId, ctx.session.user.id),
      });
      if (!provider) {
        throw new Error("Profil prestataire introuvable");
      }

      const [offer] = await ctx.db
        .insert(offers)
        .values({
          providerId: provider.id,
          title: input.title,
          description: input.description,
          normalPrice: input.normalPrice,
          dealPrice: input.dealPrice,
          category: input.category,
          images: input.images,
          visibilityHours: input.visibilityHours,
        })
        .returning();

      return offer;
    }),

  // Provider: update offer
  update: providerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        normalPrice: z.string().optional(),
        dealPrice: z.string().optional(),
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
        images: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        visibilityHours: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(offers)
        .set(data)
        .where(eq(offers.id, id))
        .returning();
      return updated;
    }),

  // Provider: add slot to offer
  addSlot: providerProcedure
    .input(
      z.object({
        offerId: z.string().uuid(),
        date: z.string(),
        time: z.string(),
        capacity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate visibleFrom based on offer's visibilityHours
      const offer = await ctx.db.query.offers.findFirst({
        where: eq(offers.id, input.offerId),
      });
      if (!offer) throw new Error("Offre introuvable");

      const slotDateTime = new Date(`${input.date}T${input.time}:00`);
      const visibleFrom = new Date(
        slotDateTime.getTime() - offer.visibilityHours * 60 * 60 * 1000,
      );

      const [slot] = await ctx.db
        .insert(offerSlots)
        .values({
          offerId: input.offerId,
          date: input.date,
          time: input.time,
          capacity: input.capacity,
          remainingSpots: input.capacity,
          visibleFrom,
          expiresAt: slotDateTime,
        })
        .returning();

      return slot;
    }),

  // Provider: delete a slot
  deleteSlot: providerProcedure
    .input(z.object({ slotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(offerSlots).where(eq(offerSlots.id, input.slotId));
      return { success: true };
    }),
});
