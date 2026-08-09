"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { SiteHeader } from "@/components/site-header";
import {
  formatPrice,
  calculateDiscount,
  formatDate,
  CATEGORIES,
} from "@evanesc/ui";

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: offer, isLoading } = trpc.offers.byId.useQuery({ id });
  const { data: session } = trpc.auth.getSession.useQuery();
  const { data: config } = trpc.config.get.useQuery();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      utils.offers.byId.invalidate({ id });
      utils.bookings.myBookings.invalidate();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setBookingDone(true);
      }
    },
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/login?redirect=${encodeURIComponent(`/offers/${id}`)}`);
      } else {
        setBookingError(err.message);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Offre introuvable</p>
        <Link href="/" className="text-accent hover:underline">
          Retour aux offres
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(offer.normalPrice, offer.dealPrice);
  const cat = CATEGORIES.find((c) => c.value === offer.category);
  const selectedSlot = offer.slots.find((s) => s.id === selectedSlotId);

  const handleBook = () => {
    if (!selectedSlotId) return;
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/offers/${id}`)}`);
      return;
    }
    setBookingError("");
    createBooking.mutate({ offerSlotId: selectedSlotId, guestsCount: guests });
  };

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Toutes les offres
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: images + description */}
          <div className="space-y-6 lg:col-span-3">
            {/* Image gallery */}
            {offer.images.length > 0 && (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={offer.images[0]}
                  alt={offer.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
                {offer.images.length > 1 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {offer.images.slice(1).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="h-24 w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {cat?.emoji} {cat?.label}
                </span>
                {offer.categories?.map((c) => {
                  const extra = CATEGORIES.find((ca) => ca.value === c);
                  return (
                    <span
                      key={c}
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                    >
                      {extra?.emoji} {extra?.label}
                    </span>
                  );
                })}
              </div>
              <h1 className="mt-3 text-2xl font-bold">{offer.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                par {offer.provider.name}
              </p>
              {offer.description && (
                <p className="mt-4 text-foreground leading-relaxed">
                  {offer.description}
                </p>
              )}
            </div>

            {/* Provider info */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-lg font-semibold">{offer.provider.name}</h2>
              {offer.provider.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {offer.provider.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {offer.provider.address && <span>{offer.provider.address}</span>}
                {offer.provider.instagram && (
                  <span>{offer.provider.instagram}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: pricing + booking */}
          <div className="space-y-4 lg:col-span-2">
            {/* Pricing card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-accent">
                  {formatPrice(offer.dealPrice)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(offer.normalPrice)}
                </span>
              </div>
              <span className="mt-1 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                -{discount}% de réduction
              </span>
            </div>

            {bookingDone ? (
              /* Success state */
              <div className="rounded-xl border border-success/30 bg-green-50 p-6 text-center">
                <p className="text-2xl">🎉</p>
                <p className="mt-2 font-semibold text-success">
                  Réservation confirmée !
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le règlement s&apos;effectue sur place auprès du prestataire.
                </p>
                <Link
                  href="/bookings"
                  className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Voir mes réservations
                </Link>
              </div>
            ) : (
              <>
                {/* Slot picker */}
                <div className="rounded-xl border border-border bg-white">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold">Choisir un créneau</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {offer.slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() =>
                          setSelectedSlotId(
                            selectedSlotId === slot.id ? null : slot.id,
                          )
                        }
                        className={`flex w-full items-center justify-between p-4 text-left transition-colors ${
                          selectedSlotId === slot.id
                            ? "bg-accent/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(slot.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.time} &mdash; {slot.remainingSpots} place
                            {slot.remainingSpots !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                            selectedSlotId === slot.id
                              ? "border-accent bg-accent text-white"
                              : "border-border"
                          }`}
                        >
                          {selectedSlotId === slot.id ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                    {offer.slots.length === 0 && (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        Aucun créneau disponible
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking confirmation */}
                {selectedSlot && (
                  <div className="space-y-4 rounded-xl border border-border bg-white p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Nombre de personnes
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold hover:bg-border"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center font-semibold">
                          {guests}
                        </span>
                        <button
                          onClick={() =>
                            setGuests(
                              Math.min(selectedSlot.remainingSpots, guests + 1),
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold hover:bg-border"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-accent">
                        {formatPrice(parseFloat(offer.dealPrice) * guests)}
                      </span>
                    </div>

                    {bookingError && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
                        {bookingError}
                      </div>
                    )}

                    <button
                      onClick={handleBook}
                      disabled={createBooking.isPending}
                      className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-50"
                    >
                      {createBooking.isPending
                        ? "Réservation..."
                        : config?.paymentsEnabled
                          ? `Payer ${formatPrice(parseFloat(offer.dealPrice) * guests)}`
                          : "Confirmer la réservation"}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      {config?.paymentsEnabled
                        ? "Paiement sécurisé par Stripe"
                        : "Le règlement s'effectue sur place auprès du prestataire"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
