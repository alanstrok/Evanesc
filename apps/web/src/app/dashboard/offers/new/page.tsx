"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@evanesc/ui";

export default function NewOfferPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const createOffer = trpc.offers.create.useMutation({
    onSuccess: () => {
      utils.offers.myOffers.invalidate();
      router.push("/dashboard/offers");
    },
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    normalPrice: "",
    dealPrice: "",
    category: "restaurants" as const,
    visibilityHours: 48,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOffer.mutate({
      ...form,
      normalPrice: form.normalPrice,
      dealPrice: form.dealPrice,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvelle offre</h1>
        <p className="text-muted-foreground">
          Créez une offre et ajoutez des créneaux ensuite
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-border bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Dîner Sunset Menu Dégustation"
            required
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez votre offre..."
            rows={3}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Catégorie</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as typeof form.category })
            }
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Prix normal (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.normalPrice}
              onChange={(e) =>
                setForm({ ...form, normalPrice: e.target.value })
              }
              placeholder="180.00"
              required
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Prix deal (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.dealPrice}
              onChange={(e) => setForm({ ...form, dealPrice: e.target.value })}
              placeholder="120.00"
              required
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Visibilité (heures avant le créneau)
          </label>
          <input
            type="number"
            min="1"
            value={form.visibilityHours}
            onChange={(e) =>
              setForm({ ...form, visibilityHours: parseInt(e.target.value) || 48 })
            }
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Le créneau deviendra visible X heures avant l&apos;heure prévue
          </p>
        </div>

        {createOffer.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
            {createOffer.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createOffer.isPending}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {createOffer.isPending ? "Création..." : "Créer l'offre"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
