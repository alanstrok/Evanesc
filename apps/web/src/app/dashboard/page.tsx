"use client";

import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const { data: offers } = trpc.offers.myOffers.useQuery();
  const { data: bookings } = trpc.bookings.providerBookings.useQuery();

  const activeOffers = offers?.filter((o) => o.isActive).length ?? 0;
  const totalBookings = bookings?.length ?? 0;
  const confirmedBookings =
    bookings?.filter((b) => b.status === "confirmed").length ?? 0;

  const stats = [
    { label: "Offres actives", value: activeOffers, icon: "🏷️" },
    { label: "Réservations totales", value: totalBookings, icon: "📋" },
    { label: "Confirmées", value: confirmedBookings, icon: "✅" },
    {
      label: "En attente",
      value: totalBookings - confirmedBookings,
      icon: "⏳",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace prestataire
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="rounded-xl border border-border bg-white">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Dernières réservations</h2>
        </div>
        <div className="divide-y divide-border">
          {bookings?.slice(0, 5).map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">{booking.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.offer.title} — {booking.slot.date} à{" "}
                  {booking.slot.time}
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
          {(!bookings || bookings.length === 0) && (
            <p className="p-6 text-center text-muted-foreground">
              Aucune réservation pour le moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
