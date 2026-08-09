"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@evanesc/ui";
import { ImageUploader } from "@/components/image-uploader";

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
    categories: [] as string[],
    images: [] as string[],
    totalSpots: "",
    visibilityHours: 48,
    slotDate: "",
    slotTime: "",
    slotCapacity: 1,
  });

  const toggleCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOffer.mutate({
      title: form.title,
      description: form.description,
      normalPrice: form.normalPrice,
      dealPrice: form.dealPrice,
      category: form.category,
      categories: form.categories,
      images: form.images,
      totalSpots: form.totalSpots ? parseInt(form.totalSpots) : undefined,
      visibilityHours: form.visibilityHours,
      ...(form.slotDate && form.slotTime
        ? {
            slotDate: form.slotDate,
            slotTime: form.slotTime,
            slotCapacity: form.slotCapacity,
          }
        : {}),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvelle offre</h1>
        <p className="text-muted-foreground">
          Créez une offre avec un premier créneau
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

        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-medium">Photos</label>
          <ImageUploader
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
        </div>

        {/* Primary category */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Catégorie principale
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as typeof form.category,
              })
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

        {/* Multi-category tags for packages */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Catégories additionnelles (packages)
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((cat) => cat.value !== form.category).map(
              (cat) => {
                const selected = form.categories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              },
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sélectionnez plusieurs catégories si l&apos;offre est un package
          </p>
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
            Places disponibles
          </label>
          <input
            type="number"
            min="1"
            value={form.totalSpots}
            onChange={(e) =>
              setForm({ ...form, totalSpots: e.target.value })
            }
            placeholder="Ex: 3 chambres, 8 couverts..."
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Nombre total de places disponibles (ex: 3 chambres, 8 couverts)
          </p>
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
              setForm({
                ...form,
                visibilityHours: parseInt(e.target.value) || 48,
              })
            }
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Le créneau deviendra visible X heures avant l&apos;heure prévue
          </p>
        </div>

        {/* First slot */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <label className="mb-3 block text-sm font-semibold">
            Premier créneau (optionnel)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Date
              </label>
              <input
                type="date"
                value={form.slotDate}
                onChange={(e) =>
                  setForm({ ...form, slotDate: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Heure
              </label>
              <input
                type="time"
                value={form.slotTime}
                onChange={(e) =>
                  setForm({ ...form, slotTime: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Places
              </label>
              <input
                type="number"
                min="1"
                value={form.slotCapacity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slotCapacity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
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
