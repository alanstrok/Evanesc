"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@evanesc/ui";

export default function AdminPartnersPage() {
  const { data: providers, isLoading } = trpc.providers.adminList.useQuery();
  const utils = trpc.useUtils();

  const setVerified = trpc.providers.setVerified.useMutation({
    onSuccess: () => utils.providers.adminList.invalidate(),
  });
  const adminUpdate = trpc.providers.adminUpdate.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
      setEditingId(null);
    },
  });
  const adminDelete = trpc.providers.adminDelete.useMutation({
    onSuccess: () => utils.providers.adminList.invalidate(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "restaurants" as string,
    address: "",
    phone: "",
    email: "",
    instagram: "",
    website: "",
    description: "",
  });

  const startEdit = (provider: NonNullable<typeof providers>[0]) => {
    setEditingId(provider.id);
    setEditForm({
      name: provider.name,
      category: provider.category,
      address: provider.address ?? "",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
      instagram: provider.instagram ?? "",
      website: provider.website ?? "",
      description: provider.description ?? "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    adminUpdate.mutate({
      id: editingId,
      ...editForm,
      category: editForm.category as any,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partenaires</h1>
        <p className="text-muted-foreground">
          Gérez les partenaires, leurs informations et leur vérification
        </p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      <div className="space-y-4">
        {providers?.map((provider) => (
          <div
            key={provider.id}
            className="rounded-xl border border-border bg-white"
          >
            {editingId === provider.id ? (
              /* Edit mode */
              <div className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Catégorie
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="+590 690 XX XX XX"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Email de contact
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) =>
                        setEditForm({ ...editForm, instagram: e.target.value })
                      }
                      placeholder="@handle"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Site web
                    </label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm({ ...editForm, website: e.target.value })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={adminUpdate.isPending}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                  >
                    {adminUpdate.isPending ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {provider.name}
                      </h3>
                      {provider.isVerified ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
                          Vérifié
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-600">
                          En attente
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {
                          CATEGORIES.find(
                            (c) => c.value === provider.category,
                          )?.emoji
                        }{" "}
                        {
                          CATEGORIES.find(
                            (c) => c.value === provider.category,
                          )?.label
                        }
                      </span>
                      <span>{provider.user.email}</span>
                      {provider.offers.length > 0 && (
                        <span>
                          {provider.offers.length} offre
                          {provider.offers.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Contact info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {provider.address && <span>{provider.address}</span>}
                      {provider.phone && <span>{provider.phone}</span>}
                      {provider.email && <span>{provider.email}</span>}
                      {provider.instagram && (
                        <span>{provider.instagram}</span>
                      )}
                      {provider.website && <span>{provider.website}</span>}
                    </div>
                    {provider.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {provider.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(provider)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() =>
                        setVerified.mutate({
                          providerId: provider.id,
                          isVerified: !provider.isVerified,
                        })
                      }
                      disabled={setVerified.isPending}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                        provider.isVerified
                          ? "bg-destructive hover:bg-destructive/90"
                          : "bg-success hover:bg-success/90"
                      }`}
                    >
                      {provider.isVerified ? "Retirer" : "Vérifier"}
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Supprimer le partenaire "${provider.name}" ? Cette action est irréversible.`,
                          )
                        ) {
                          adminDelete.mutate({ id: provider.id });
                        }
                      }}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {providers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun partenaire inscrit
          </p>
        </div>
      )}
    </div>
  );
}
