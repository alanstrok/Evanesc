"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  formatPrice,
  calculateDiscount,
  formatDate,
  CATEGORIES,
} from "@evanesc/ui";

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: offer, isLoading } = trpc.offers.byId.useQuery({ id });

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

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Evanesc
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Connexion
          </Link>
        </div>
      </header>

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
              <h2 className="text-lg font-semibold">
                {offer.provider.name}
              </h2>
              {offer.provider.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {offer.provider.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {offer.provider.address && (
                  <span>{offer.provider.address}</span>
                )}
                {offer.provider.instagram && (
                  <span>{offer.provider.instagram}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: pricing + slots */}
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
              {offer.totalSpots && (
                <p className="mt-3 text-sm font-medium text-foreground">
                  {offer.totalSpots} place
                  {offer.totalSpots !== 1 ? "s" : ""} disponible
                  {offer.totalSpots !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Available slots */}
            <div className="rounded-xl border border-border bg-white">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold">Créneaux disponibles</h3>
              </div>
              <div className="divide-y divide-border">
                {offer.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4"
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
                    <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light">
                      Réserver
                    </button>
                  </div>
                ))}
                {offer.slots.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Aucun créneau disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
