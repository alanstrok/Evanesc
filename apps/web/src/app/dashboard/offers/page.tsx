"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatPrice, calculateDiscount } from "@evanesc/ui";

export default function OffersPage() {
  const { data: offers, isLoading } = trpc.offers.myOffers.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes offres</h1>
          <p className="text-muted-foreground">
            Gérez vos offres et créneaux
          </p>
        </div>
        <Link
          href="/dashboard/offers/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
        >
          + Nouvelle offre
        </Link>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers?.map((offer) => (
          <Link
            key={offer.id}
            href={`/dashboard/offers/${offer.id}`}
            className="group rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-accent">
                  {offer.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {offer.description}
                </p>
              </div>
              {offer.isActive ? (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-lg font-bold text-accent">
                {formatPrice(offer.dealPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(offer.normalPrice)}
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                -{calculateDiscount(offer.normalPrice, offer.dealPrice)}%
              </span>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              {offer.slots.length} créneau{offer.slots.length !== 1 && "x"} programmé
              {offer.slots.length !== 1 && "s"}
            </div>
          </Link>
        ))}
      </div>

      {offers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore créé d&apos;offre
          </p>
          <Link
            href="/dashboard/offers/new"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            Créer ma première offre
          </Link>
        </div>
      )}
    </div>
  );
}
