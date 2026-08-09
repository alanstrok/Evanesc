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

  if (isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (!offer) {
    return <p className="text-muted-foreground">Offre introuvable</p>;
  }

  const discount = calculateDiscount(offer.normalPrice, offer.dealPrice);

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
          {offer.isActive ? "L'offre est visible par les clients" : "L'offre est masquée"}
        </span>
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
          {offer.slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">
                  {slot.date} à {slot.time}
                </p>
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
          ))}
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
