import { z } from "zod";
import { eq, and, ne, desc, gt, gte, sql } from "drizzle-orm";
import { bookings, offerSlots, offers, providers } from "@evanesc/db";
import { router, protectedProcedure, providerProcedure } from "../trpc";

export const bookingsRouter = router({
  // Customer: list my bookings
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.bookings.findMany({
      where: eq(bookings.userId, ctx.session.user.id),
      with: {
        offerSlot: {
          with: {
            offer: {
              with: { provider: true },
            },
          },
        },
      },
      orderBy: [desc(bookings.createdAt)],
    });
  }),

  // Customer: create booking
  create: protectedProcedure
    .input(
      z.object({
        offerSlotId: z.string().uuid(),
        guestsCount: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Pre-checks for friendly error messages (non-authoritative)
      const slot = await ctx.db.query.offerSlots.findFirst({
        where: eq(offerSlots.id, input.offerSlotId),
      });

      if (!slot) {
        throw new Error("Créneau introuvable");
      }

      const now = new Date();
      if (new Date(slot.expiresAt) <= now) {
        throw new Error("Ce créneau a expiré");
      }

      if (slot.remainingSpots < input.guestsCount) {
        throw new Error("Plus assez de places disponibles");
      }

      return ctx.db.transaction(async (tx) => {
        // Guarded atomic decrement — the WHERE clause is the authoritative
        // availability check, so concurrent bookings can never oversell
        const decremented = await tx
          .update(offerSlots)
          .set({
            remainingSpots: sql`${offerSlots.remainingSpots} - ${input.guestsCount}`,
          })
          .where(
            and(
              eq(offerSlots.id, input.offerSlotId),
              gte(offerSlots.remainingSpots, input.guestsCount),
              gt(offerSlots.expiresAt, now),
            ),
          )
          .returning({ id: offerSlots.id });

        if (decremented.length === 0) {
          throw new Error("Plus assez de places disponibles");
        }

        const [booking] = await tx
          .insert(bookings)
          .values({
            userId: ctx.session.user.id,
            offerSlotId: input.offerSlotId,
            guestsCount: input.guestsCount,
            status: "pending",
          })
          .returning();

        return booking;
      });
    }),

  // Customer: cancel booking
  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // Atomic status flip — only one concurrent cancel can win,
        // so spots are never restored twice
        const [updated] = await tx
          .update(bookings)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(bookings.id, input.bookingId),
              eq(bookings.userId, ctx.session.user.id),
              ne(bookings.status, "cancelled"),
            ),
          )
          .returning();

        if (!updated) {
          const existing = await tx.query.bookings.findFirst({
            where: and(
              eq(bookings.id, input.bookingId),
              eq(bookings.userId, ctx.session.user.id),
            ),
          });
          if (!existing) throw new Error("Réservation introuvable");
          throw new Error("Déjà annulée");
        }

        // Restore spots
        await tx
          .update(offerSlots)
          .set({
            remainingSpots: sql`${offerSlots.remainingSpots} + ${updated.guestsCount}`,
          })
          .where(eq(offerSlots.id, updated.offerSlotId));

        return updated;
      });
    }),

  // Customer: confirm booking (after payment)
  confirm: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        stripePaymentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(bookings)
        .set({
          status: "confirmed",
          stripePaymentId: input.stripePaymentId,
        })
        .where(
          and(
            eq(bookings.id, input.bookingId),
            eq(bookings.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return updated;
    }),

  // Provider: list bookings for my offers
  providerBookings: providerProcedure.query(async ({ ctx }) => {
    const provider = await ctx.db.query.providers.findFirst({
      where: eq(providers.userId, ctx.session.user.id),
    });
    if (!provider) return [];

    const providerOffers = await ctx.db.query.offers.findMany({
      where: eq(offers.providerId, provider.id),
      with: {
        slots: {
          with: {
            bookings: {
              with: { user: true },
              orderBy: [desc(bookings.createdAt)],
            },
          },
        },
      },
    });

    // Flatten bookings from all slots
    return providerOffers.flatMap((offer) =>
      offer.slots.flatMap((slot) =>
        slot.bookings.map((booking) => ({
          ...booking,
          offer: { id: offer.id, title: offer.title },
          slot: { date: slot.date, time: slot.time },
        })),
      ),
    );
  }),
});
