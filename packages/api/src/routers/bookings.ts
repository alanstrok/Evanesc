import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
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
      // Check slot availability
      const slot = await ctx.db.query.offerSlots.findFirst({
        where: eq(offerSlots.id, input.offerSlotId),
        with: { offer: true },
      });

      if (!slot) {
        throw new Error("Créneau introuvable");
      }

      if (slot.remainingSpots < input.guestsCount) {
        throw new Error("Plus assez de places disponibles");
      }

      const now = new Date();
      if (new Date(slot.expiresAt) <= now) {
        throw new Error("Ce créneau a expiré");
      }

      // Create booking
      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          userId: ctx.session.user.id,
          offerSlotId: input.offerSlotId,
          guestsCount: input.guestsCount,
          status: "pending",
        })
        .returning();

      // Decrease remaining spots
      await ctx.db
        .update(offerSlots)
        .set({
          remainingSpots: sql`${offerSlots.remainingSpots} - ${input.guestsCount}`,
        })
        .where(eq(offerSlots.id, input.offerSlotId));

      return booking;
    }),

  // Customer: cancel booking
  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, input.bookingId),
          eq(bookings.userId, ctx.session.user.id),
        ),
      });

      if (!booking) throw new Error("Réservation introuvable");
      if (booking.status === "cancelled") throw new Error("Déjà annulée");

      // Update booking status
      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.bookingId))
        .returning();

      // Restore spots
      await ctx.db
        .update(offerSlots)
        .set({
          remainingSpots: sql`${offerSlots.remainingSpots} + ${booking.guestsCount}`,
        })
        .where(eq(offerSlots.id, booking.offerSlotId));

      return updated;
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
