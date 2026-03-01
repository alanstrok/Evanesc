"use client";

import { trpc } from "@/lib/trpc";

export default function BookingsPage() {
  const { data: bookings, isLoading } =
    trpc.bookings.providerBookings.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réservations</h1>
        <p className="text-muted-foreground">
          Toutes les réservations de vos offres
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {isLoading && (
          <p className="p-6 text-muted-foreground">Chargement...</p>
        )}

        <div className="divide-y divide-border">
          {bookings?.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 lg:p-6"
            >
              <div className="space-y-1">
                <p className="font-medium">{booking.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{booking.offer.title}</span>
                  {" — "}
                  {booking.slot.date} à {booking.slot.time}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.guestsCount} personne
                  {booking.guestsCount > 1 && "s"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  booking.status === "confirmed"
                    ? "bg-green-50 text-success"
                    : booking.status === "cancelled"
                      ? "bg-red-50 text-destructive"
                      : "bg-yellow-50 text-yellow-600"
                }`}
              >
                {booking.status === "confirmed"
                  ? "Confirmé"
                  : booking.status === "cancelled"
                    ? "Annulé"
                    : "En attente"}
              </span>
            </div>
          ))}
        </div>

        {bookings?.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            Aucune réservation pour le moment
          </p>
        )}
      </div>
    </div>
  );
}
