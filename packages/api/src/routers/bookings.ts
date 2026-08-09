import { z } from "zod";
import { eq, and, ne, desc, gt, gte, sql } from "drizzle-orm";
import { bookings, offerSlots, offers, providers } from "@evanesc/db";
import { router, protectedProcedure, providerProcedure } from "../trpc";
import { paymentsEnabled, getStripe, appUrl } from "../lib/payments";

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
        with: { offer: true },
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

      const withPayment = paymentsEnabled();

      const booking = await ctx.db.transaction(async (tx) => {
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

        const [created] = await tx
          .insert(bookings)
          .values({
            userId: ctx.session.user.id,
            offerSlotId: input.offerSlotId,
            guestsCount: input.guestsCount,
            // Without Stripe configured, the reservation is final immediately
            // (payment on site). With Stripe, it holds the spots until the
            // checkout webhook confirms or expires it.
            status: withPayment ? "pending" : "confirmed",
          })
          .returning();

        return created;
      });

      if (!withPayment) {
        return { booking, checkoutUrl: null };
      }

      try {
        const session = await getStripe().checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: slot.offer.title,
                  description: `${slot.date} à ${slot.time} — ${input.guestsCount} personne(s)`,
                },
                unit_amount: Math.round(parseFloat(slot.offer.dealPrice) * 100),
              },
              quantity: input.guestsCount,
            },
          ],
          metadata: { bookingId: booking.id },
          // Stripe requires at least 30 min; the webhook releases the spots
          // if the session expires unpaid
          expires_at: Math.floor(now.getTime() / 1000) + 35 * 60,
          success_url: `${appUrl()}/bookings?payment=success`,
          cancel_url: `${appUrl()}/offers/${slot.offer.id}?payment=cancelled`,
        });

        await ctx.db
          .update(bookings)
          .set({ stripePaymentId: session.id })
          .where(eq(bookings.id, booking.id));

        return { booking, checkoutUrl: session.url };
      } catch {
        // Stripe unreachable: release the held spots so they aren't lost
        await ctx.db.transaction(async (tx) => {
          const [cancelled] = await tx
            .update(bookings)
            .set({ status: "cancelled" })
            .where(
              and(eq(bookings.id, booking.id), ne(bookings.status, "cancelled")),
            )
            .returning();
          if (cancelled) {
            await tx
              .update(offerSlots)
              .set({
                remainingSpots: sql`${offerSlots.remainingSpots} + ${cancelled.guestsCount}`,
              })
              .where(eq(offerSlots.id, cancelled.offerSlotId));
          }
        });
        throw new Error(
          "Le paiement est momentanément indisponible, veuillez réessayer",
        );
      }
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
