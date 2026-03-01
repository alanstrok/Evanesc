"use client";

import { trpc } from "@/lib/trpc";
import { formatPrice, calculateDiscount, CATEGORIES } from "@evanesc/ui";

export default function AdminOffersPage() {
  const { data: allOffers, isLoading } = trpc.offers.adminList.useQuery();
  const utils = trpc.useUtils();

  const adminUpdate = trpc.offers.adminUpdate.useMutation({
    onSuccess: () => utils.offers.adminList.invalidate(),
  });
  const adminDelete = trpc.offers.adminDelete.useMutation({
    onSuccess: () => utils.offers.adminList.invalidate(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Gestion des offres
        </h1>
        <p className="text-muted-foreground">
          Visualisez et modérez toutes les offres de la plateforme
        </p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      <div className="rounded-xl border border-border bg-white">
        <div className="divide-y divide-border">
          {allOffers?.map((offer) => {
            const cat = CATEGORIES.find((c) => c.value === offer.category);
            const discount = calculateDiscount(
              offer.normalPrice,
              offer.dealPrice,
            );

            return (
              <div key={offer.id} className="p-4 lg:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{offer.title}</h3>
                      {offer.isActive ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {cat?.emoji} {cat?.label}
                      </span>
                      {offer.categories && offer.categories.length > 0 && (
                        <>
                          {offer.categories.map((c) => {
                            const extra = CATEGORIES.find(
                              (ca) => ca.value === c,
                            );
                            return (
                              <span
                                key={c}
                                className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                              >
                                {extra?.emoji} {extra?.label}
                              </span>
                            );
                          })}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      par{" "}
                      <span className="font-medium text-foreground">
                        {offer.provider.name}
                      </span>
                    </p>
                    {offer.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {offer.description}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-bold text-accent">
                        {formatPrice(offer.dealPrice)}
                      </span>
                      <span className="text-muted-foreground line-through">
                        {formatPrice(offer.normalPrice)}
                      </span>
                      <span className="text-xs font-bold text-accent">
                        -{discount}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {offer.slots.length} créneau
                        {offer.slots.length !== 1 ? "x" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        adminUpdate.mutate({
                          id: offer.id,
                          isActive: !offer.isActive,
                        })
                      }
                      disabled={adminUpdate.isPending}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                        offer.isActive
                          ? "bg-destructive hover:bg-destructive/90"
                          : "bg-success hover:bg-success/90"
                      }`}
                    >
                      {offer.isActive ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Supprimer l'offre "${offer.title}" ? Cette action est irréversible.`,
                          )
                        ) {
                          adminDelete.mutate({ id: offer.id });
                        }
                      }}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allOffers?.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            Aucune offre sur la plateforme
          </p>
        )}
      </div>
    </div>
  );
}
