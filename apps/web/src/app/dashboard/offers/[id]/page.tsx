"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatPrice, calculateDiscount, CATEGORIES } from "@evanesc/ui";
import { ImageUploader } from "@/components/image-uploader";

export default function EditOfferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: offer, isLoading } = trpc.offers.myOfferById.useQuery({ id });
  const updateOffer = trpc.offers.update.useMutation({
    onSuccess: () => {
      utils.offers.myOffers.invalidate();
      utils.offers.myOfferById.invalidate({ id });
    },
  });
  const addSlot = trpc.offers.addSlot.useMutation({
    onSuccess: () => {
      utils.offers.myOfferById.invalidate({ id });
      utils.offers.myOffers.invalidate();
    },
  });
  const deleteSlot = trpc.offers.deleteSlot.useMutation({
    onSuccess: () => {
      utils.offers.myOfferById.invalidate({ id });
    },
  });

  const [slotForm, setSlotForm] = useState({
    date: "",
    time: "",
    capacity: 1,
  });
  const [visibilityInput, setVisibilityInput] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (!offer) {
    return <p className="text-muted-foreground">Offre introuvable</p>;
  }

  const discount = calculateDiscount(offer.normalPrice, offer.dealPrice);

  const formatDateTime = (d: Date | string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));

  const now = Date.now();
  const slotStatus = (slot: (typeof offer.slots)[number]) => {
    if (new Date(slot.expiresAt).getTime() <= now)
      return {
        label: "Expiré",
        className: "bg-gray-100 text-muted-foreground",
      };
    if (slot.remainingSpots <= 0)
      return { label: "Complet", className: "bg-yellow-50 text-yellow-600" };
    if (new Date(slot.visibleFrom).getTime() <= now)
      return { label: "En ligne", className: "bg-green-50 text-success" };
    return {
      label: `En ligne le ${formatDateTime(slot.visibleFrom)}`,
      className: "bg-yellow-50 text-yellow-600",
    };
  };

  const liveSlots = offer.slots.filter(
    (s) =>
      new Date(s.expiresAt).getTime() > now &&
      new Date(s.visibleFrom).getTime() <= now &&
      s.remainingSpots > 0,
  ).length;

  const visibilityValue = visibilityInput ?? String(offer.visibilityHours);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    addSlot.mutate({
      offerId: id,
      ...slotForm,
    });
    setSlotForm({ date: "", time: "", capacity: 1 });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{offer.title}</h1>
          <p className="text-muted-foreground">{offer.description}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Retour
        </button>
      </div>

      {/* Offer stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-sm text-muted-foreground">Prix normal</p>
          <p className="text-lg font-bold line-through">
            {formatPrice(offer.normalPrice)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-sm text-muted-foreground">Prix deal</p>
          <p className="text-lg font-bold text-accent">
            {formatPrice(offer.dealPrice)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-sm text-muted-foreground">Réduction</p>
          <p className="text-lg font-bold text-accent">-{discount}%</p>
        </div>
      </div>

      {/* Toggle active status */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
        <button
          onClick={() =>
            updateOffer.mutate({ id, isActive: !offer.isActive })
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
            offer.isActive ? "bg-destructive hover:bg-destructive/90" : "bg-success hover:bg-success/90"
          }`}
        >
          {offer.isActive ? "Désactiver l'offre" : "Activer l'offre"}
        </button>
        <span className="text-sm text-muted-foreground">
          {!offer.isActive
            ? "L'offre est masquée"
            : liveSlots > 0
              ? `${liveSlots} créneau${liveSlots > 1 ? "x" : ""} actuellement en ligne`
              : "Offre active — aucun créneau dans sa fenêtre de visibilité pour le moment"}
        </span>
      </div>

      {/* Visibility window */}
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold">Fenêtre de visibilité</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque créneau apparaît aux clients X heures avant son horaire, pour
          garder l&apos;effet &laquo; deal de dernière minute &raquo;.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min="1"
            value={visibilityValue}
            onChange={(e) => setVisibilityInput(e.target.value)}
            className="w-24 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <span className="text-sm text-muted-foreground">
            heures avant le créneau
          </span>
          <button
            onClick={() => {
              const hours = parseInt(visibilityValue);
              if (hours >= 1) {
                updateOffer.mutate({ id, visibilityHours: hours });
              }
            }}
            disabled={
              updateOffer.isPending ||
              parseInt(visibilityValue) === offer.visibilityHours ||
              !(parseInt(visibilityValue) >= 1)
            }
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ex : 48 = visible 2 jours avant. Augmentez la valeur (ex : 720 = 30
          jours) pour rendre les créneaux visibles immédiatement. S&apos;applique
          aussi aux créneaux déjà programmés.
        </p>
      </div>

      {/* Photos */}
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Photos</h2>
        <ImageUploader
          images={offer.images}
          onChange={(images) => updateOffer.mutate({ id, images })}
        />
      </div>

      {/* Slots management */}
      <div className="rounded-xl border border-border bg-white">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Créneaux</h2>
        </div>

        <div className="divide-y divide-border">
          {offer.slots.map((slot) => {
            const status = slotStatus(slot);
            return (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {slot.date} à {slot.time}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {slot.remainingSpots}/{slot.capacity} places restantes
                  </p>
                </div>
                <button
                  onClick={() => deleteSlot.mutate({ slotId: slot.id })}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            );
          })}
          {offer.slots.length === 0 && (
            <p className="p-6 text-center text-muted-foreground">
              Aucun créneau programmé
            </p>
          )}
        </div>

        {/* Add slot form */}
        <div className="border-t border-border p-6">
          <h3 className="mb-4 text-sm font-semibold">Ajouter un créneau</h3>
          <form onSubmit={handleAddSlot} className="flex flex-wrap gap-3">
            <input
              type="date"
              value={slotForm.date}
              onChange={(e) =>
                setSlotForm({ ...slotForm, date: e.target.value })
              }
              required
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={slotForm.time}
              onChange={(e) =>
                setSlotForm({ ...slotForm, time: e.target.value })
              }
              required
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="1"
              value={slotForm.capacity}
              onChange={(e) =>
                setSlotForm({
                  ...slotForm,
                  capacity: parseInt(e.target.value) || 1,
                })
              }
              placeholder="Places"
              className="w-20 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addSlot.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
            >
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
