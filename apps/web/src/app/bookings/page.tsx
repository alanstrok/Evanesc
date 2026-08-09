"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, formatDate } from "@evanesc/ui";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmé", className: "bg-green-50 text-success" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-destructive" },
  pending: { label: "En attente", className: "bg-yellow-50 text-yellow-600" },
};

export default function BookingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(
    undefined,
    { enabled: Boolean(session?.user) },
  );

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => utils.bookings.myBookings.invalidate(),
  });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/login?redirect=${encodeURIComponent("/bookings")}`);
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Mes réservations</h1>
        <p className="text-muted-foreground">
          Retrouvez toutes vos réservations
        </p>

        <div className="mt-6 space-y-4">
          {isLoading && (
            <p className="py-8 text-center text-muted-foreground">
              Chargement...
            </p>
          )}

          {bookings?.map((booking) => {
            const status =
              STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-border bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {booking.offerSlot.offer.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.offerSlot.offer.provider.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {formatDate(booking.offerSlot.date)} à{" "}
                    {booking.offerSlot.time}
                  </span>
                  <span>
                    {booking.guestsCount} personne
                    {booking.guestsCount > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-accent">
                    {formatPrice(
                      parseFloat(booking.offerSlot.offer.dealPrice) *
                        booking.guestsCount,
                    )}
                  </span>
                </div>

                {booking.status !== "cancelled" && (
                  <button
                    onClick={() =>
                      cancelBooking.mutate({ bookingId: booking.id })
                    }
                    disabled={cancelBooking.isPending}
                    className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    Annuler la réservation
                  </button>
                )}
              </div>
            );
          })}

          {bookings?.length === 0 && !isLoading && (
            <div className="rounded-xl border border-border bg-white py-12 text-center">
              <p className="text-muted-foreground">
                Aucune réservation pour le moment
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
              >
                Découvrir les offres
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
