"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  formatPrice,
  calculateDiscount,
  formatDate,
  CATEGORIES,
} from "@evanesc/ui";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
  const { data: offers, isLoading } = trpc.offers.list.useQuery(
    selectedCategory
      ? { category: selectedCategory as any }
      : undefined,
  );

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

      {/* Hero */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Deals éphémères à Saint-Barth
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Restaurants, spas, villas, excursions... Profitez d&apos;offres
            exclusives à durée limitée sur les meilleures adresses de l&apos;île.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory
                ? "border-accent bg-accent text-white"
                : "border-border bg-white text-foreground hover:border-accent/50"
            }`}
          >
            Tout
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.value ? undefined : cat.value,
                )
              }
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-white text-foreground hover:border-accent/50"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers grid */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isLoading && (
          <p className="py-12 text-center text-muted-foreground">
            Chargement des offres...
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers?.map((offer) => {
            const discount = calculateDiscount(
              offer.normalPrice,
              offer.dealPrice,
            );
            const cat = CATEGORIES.find((c) => c.value === offer.category);
            const nextSlot = offer.slots[0];

            return (
              <Link
                key={offer.id}
                href={`/offers/${offer.id}`}
                className="group overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative h-48 bg-muted">
                  {offer.images[0] && (
                    <img
                      src={offer.images[0]}
                      alt={offer.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                      {cat?.emoji} {cat?.label}
                    </span>
                    {offer.categories?.map((c) => {
                      const extra = CATEGORIES.find((ca) => ca.value === c);
                      return (
                        <span
                          key={c}
                          className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                        >
                          {extra?.emoji}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">
                    {offer.provider.name}
                  </p>
                  <h3 className="mt-1 font-semibold text-foreground group-hover:text-accent">
                    {offer.title}
                  </h3>
                  {offer.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {offer.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-accent">
                      {formatPrice(offer.dealPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(offer.normalPrice)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {offer.totalSpots && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                        {offer.totalSpots} place
                        {offer.totalSpots !== 1 ? "s" : ""} dispo
                      </span>
                    )}
                    {nextSlot && (
                      <span>
                        {formatDate(nextSlot.date)} à {nextSlot.time}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {offers?.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Aucune offre disponible pour le moment
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Revenez bientôt pour découvrir de nouvelles offres exclusives !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
