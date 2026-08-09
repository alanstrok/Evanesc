import Stripe from "stripe";
import { db, bookings, offerSlots } from "@evanesc/db";
import { eq, and, sql } from "drizzle-orm";

// Confirms or releases bookings based on Stripe Checkout outcomes.
// Inactive until STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are configured.
export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return new Response("Paiements non configurés", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Signature manquante", { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await db
          .update(bookings)
          .set({
            status: "confirmed",
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.id,
          })
          .where(eq(bookings.id, bookingId));
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        // Release the held spots — only if the booking is still pending,
        // and atomically so a concurrent cancel can't double-restore
        await db.transaction(async (tx) => {
          const [cancelled] = await tx
            .update(bookings)
            .set({ status: "cancelled" })
            .where(
              and(eq(bookings.id, bookingId), eq(bookings.status, "pending")),
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
      }
      break;
    }
  }

  return new Response(null, { status: 200 });
}
