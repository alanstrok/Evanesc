"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@evanesc/ui";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 12; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

type ModalType =
  | null
  | "create"
  | "edit"
  | "resetPassword"
  | "changeEmail"
  | "delete";

export default function AdminPartnersPage() {
  const { data: providers, isLoading } = trpc.providers.adminList.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const setVerified = trpc.providers.setVerified.useMutation({
    onSuccess: () => utils.providers.adminList.invalidate(),
  });
  const adminUpdate = trpc.providers.adminUpdate.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
      closeModal();
    },
  });
  const adminDelete = trpc.providers.adminDelete.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
      closeModal();
    },
  });
  const adminCreate = trpc.providers.adminCreate.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
      setShowCreatedCredentials(true);
    },
  });
  const adminResetPassword = trpc.providers.adminResetPassword.useMutation({
    onSuccess: () => {
      setShowNewPassword(true);
    },
  });
  const adminUpdateEmail = trpc.providers.adminUpdateEmail.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
      closeModal();
    },
  });
  const adminSetDisabled = trpc.providers.adminSetDisabled.useMutation({
    onSuccess: () => utils.providers.adminList.invalidate(),
  });

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    email: "",
    password: generatePassword(),
    partnerName: "",
    contactName: "",
    category: "restaurants" as string,
    description: "",
    address: "",
    phone: "",
    contactEmail: "",
    instagram: "",
    website: "",
  });
  const [showCreatedCredentials, setShowCreatedCredentials] = useState(false);

  // Edit form
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

  // Password reset
  const [newPassword, setNewPassword] = useState(generatePassword());
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");

  // Delete confirmation
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const activeProvider = providers?.find((p) => p.id === activeProviderId);

  const closeModal = () => {
    setModal(null);
    setActiveProviderId(null);
    setShowCreatedCredentials(false);
    setShowNewPassword(false);
    setDeleteConfirmName("");
  };

  const openCreate = () => {
    setCreateForm({
      email: "",
      password: generatePassword(),
      partnerName: "",
      contactName: "",
      category: "restaurants",
      description: "",
      address: "",
      phone: "",
      contactEmail: "",
      instagram: "",
      website: "",
    });
    setShowCreatedCredentials(false);
    setModal("create");
  };

  const openEdit = (provider: NonNullable<typeof providers>[0]) => {
    setActiveProviderId(provider.id);
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
    setModal("edit");
  };

  const openResetPassword = (providerId: string) => {
    setActiveProviderId(providerId);
    setNewPassword(generatePassword());
    setShowNewPassword(false);
    setModal("resetPassword");
  };

  const openChangeEmail = (provider: NonNullable<typeof providers>[0]) => {
    setActiveProviderId(provider.id);
    setNewEmail(provider.user.email);
    setModal("changeEmail");
  };

  const openDelete = (provider: NonNullable<typeof providers>[0]) => {
    setActiveProviderId(provider.id);
    setDeleteConfirmName("");
    setModal("delete");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    adminCreate.mutate({
      email: createForm.email,
      password: createForm.password,
      partnerName: createForm.partnerName,
      contactName: createForm.contactName,
      category: createForm.category as any,
      description: createForm.description || undefined,
      address: createForm.address || undefined,
      phone: createForm.phone || undefined,
      contactEmail: createForm.contactEmail || undefined,
      instagram: createForm.instagram || undefined,
      website: createForm.website || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProviderId) return;
    adminUpdate.mutate({
      id: activeProviderId,
      ...editForm,
      category: editForm.category as any,
    });
  };

  const handleResetPassword = () => {
    if (!activeProviderId) return;
    adminResetPassword.mutate({
      providerId: activeProviderId,
      newPassword,
    });
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProviderId) return;
    adminUpdateEmail.mutate({
      providerId: activeProviderId,
      newEmail,
    });
  };

  const handleDelete = () => {
    if (!activeProviderId) return;
    adminDelete.mutate({ id: activeProviderId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partenaires</h1>
          <p className="text-muted-foreground">
            Gérez les comptes partenaires et leurs profils
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light"
        >
          + Ajouter un partenaire
        </button>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      {/* Partner list */}
      <div className="space-y-4">
        {providers?.map((provider) => {
          const isDisabled = provider.user.role !== "provider" && provider.user.role !== "admin";
          return (
            <div
              key={provider.id}
              className={`rounded-xl border bg-white ${isDisabled ? "border-destructive/30 opacity-60" : "border-border"}`}
            >
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
                      {isDisabled && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-destructive">
                          Désactivé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {CATEGORIES.find((c) => c.value === provider.category)?.emoji}{" "}
                        {CATEGORIES.find((c) => c.value === provider.category)?.label}
                      </span>
                      <span>{provider.user.email}</span>
                      {provider.offers.length > 0 && (
                        <span>
                          {provider.offers.length} offre
                          {provider.offers.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {provider.address && <span>{provider.address}</span>}
                      {provider.phone && <span>{provider.phone}</span>}
                      {provider.email && <span>{provider.email}</span>}
                      {provider.instagram && <span>{provider.instagram}</span>}
                      {provider.website && <span>{provider.website}</span>}
                    </div>
                    {provider.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {provider.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEdit(provider)}
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

                    {/* Account management dropdown */}
                    <div className="relative group">
                      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        Compte
                      </button>
                      <div className="absolute right-0 top-full z-10 mt-1 hidden w-48 rounded-lg border border-border bg-white py-1 shadow-lg group-hover:block">
                        <button
                          onClick={() => openChangeEmail(provider)}
                          className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-muted"
                        >
                          Changer l&apos;email
                        </button>
                        <button
                          onClick={() => openResetPassword(provider.id)}
                          className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-muted"
                        >
                          Réinitialiser le mot de passe
                        </button>
                        <button
                          onClick={() =>
                            adminSetDisabled.mutate({
                              providerId: provider.id,
                              disabled: !isDisabled,
                            })
                          }
                          className={`flex w-full items-center px-3 py-2 text-left text-xs hover:bg-muted ${
                            isDisabled ? "text-success" : "text-destructive"
                          }`}
                        >
                          {isDisabled ? "Réactiver le compte" : "Désactiver le compte"}
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => openDelete(provider)}
                          className="flex w-full items-center px-3 py-2 text-left text-xs text-destructive hover:bg-red-50"
                        >
                          Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {providers?.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Aucun partenaire
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliquez sur &quot;Ajouter un partenaire&quot; pour créer le premier compte
          </p>
        </div>
      )}

      {/* ─── Modal backdrop ─── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* ─── CREATE PARTNER ─── */}
          {modal === "create" && !showCreatedCredentials && (
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold">Nouveau partenaire</h2>
                <p className="text-sm text-muted-foreground">
                  Créez un compte pour un nouveau prestataire
                </p>
              </div>
              <form onSubmit={handleCreate} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-accent">
                    Identifiants de connexion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Email de connexion *
                      </label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, email: e.target.value })
                        }
                        required
                        placeholder="partenaire@email.com"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Mot de passe *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={createForm.password}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, password: e.target.value })
                          }
                          required
                          minLength={8}
                          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCreateForm({
                              ...createForm,
                              password: generatePassword(),
                            })
                          }
                          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
                        >
                          Générer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Nom de l&apos;établissement *
                    </label>
                    <input
                      type="text"
                      value={createForm.partnerName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, partnerName: e.target.value })
                      }
                      required
                      placeholder="Le Bonito"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Nom du contact *
                    </label>
                    <input
                      type="text"
                      value={createForm.contactName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, contactName: e.target.value })
                      }
                      required
                      placeholder="Jean Dupont"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Catégorie *
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value })
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
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    rows={2}
                    placeholder="Description de l'établissement..."
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, address: e.target.value })
                      }
                      placeholder="Gustavia, St-Barth"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, phone: e.target.value })
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
                      value={createForm.contactEmail}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, contactEmail: e.target.value })
                      }
                      placeholder="contact@etablissement.com"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={createForm.instagram}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, instagram: e.target.value })
                      }
                      placeholder="@handle"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Site web
                    </label>
                    <input
                      type="url"
                      value={createForm.website}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, website: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                {adminCreate.error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
                    {adminCreate.error.message}
                  </p>
                )}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adminCreate.isPending}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                  >
                    {adminCreate.isPending ? "Création..." : "Créer le compte"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── CREATED CREDENTIALS ─── */}
          {modal === "create" && showCreatedCredentials && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold text-success">
                  Compte créé avec succès
                </h2>
                <p className="text-sm text-muted-foreground">
                  Communiquez ces identifiants au partenaire
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 font-mono text-sm">
                  <div className="mb-2">
                    <span className="text-muted-foreground">Email : </span>
                    <span className="font-semibold">{createForm.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mot de passe : </span>
                    <span className="font-semibold">{createForm.password}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le partenaire pourra se connecter et créer ses offres immédiatement.
                  Pensez à lui demander de changer son mot de passe.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ─── EDIT PARTNER ─── */}
          {modal === "edit" && (
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold">Modifier le partenaire</h2>
              </div>
              <form onSubmit={handleEdit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
                <div className="grid gap-3 sm:grid-cols-2">
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
                  <div className="sm:col-span-2">
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
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adminUpdate.isPending}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                  >
                    {adminUpdate.isPending ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── RESET PASSWORD ─── */}
          {modal === "resetPassword" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold">Réinitialiser le mot de passe</h2>
                <p className="text-sm text-muted-foreground">
                  {activeProvider?.name}
                </p>
              </div>
              <div className="space-y-4 p-6">
                {!showNewPassword ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Nouveau mot de passe
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setNewPassword(generatePassword())}
                          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
                        >
                          Générer
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Toutes les sessions actives du partenaire seront déconnectées.
                    </p>
                    {adminResetPassword.error && (
                      <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
                        {adminResetPassword.error.message}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleResetPassword}
                        disabled={adminResetPassword.isPending || newPassword.length < 8}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                      >
                        {adminResetPassword.isPending
                          ? "Réinitialisation..."
                          : "Réinitialiser"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                      <p className="text-sm text-muted-foreground">
                        Nouveau mot de passe :
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold">
                        {newPassword}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Communiquez ce mot de passe au partenaire. Il pourra le changer après connexion.
                    </p>
                    <button
                      onClick={closeModal}
                      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light"
                    >
                      Fermer
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── CHANGE EMAIL ─── */}
          {modal === "changeEmail" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold">Changer l&apos;email de connexion</h2>
                <p className="text-sm text-muted-foreground">
                  {activeProvider?.name}
                </p>
              </div>
              <form onSubmit={handleChangeEmail} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nouvel email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                {adminUpdateEmail.error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
                    {adminUpdateEmail.error.message}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adminUpdateEmail.isPending}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
                  >
                    {adminUpdateEmail.isPending ? "Modification..." : "Modifier"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── DELETE CONFIRMATION ─── */}
          {modal === "delete" && activeProvider && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-bold text-destructive">
                  Supprimer le partenaire
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. Le compte utilisateur, le profil
                  prestataire et toutes les offres seront supprimés.
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Tapez <span className="font-bold">{activeProvider.name}</span> pour
                    confirmer
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={activeProvider.name}
                    className="w-full rounded-lg border border-destructive/30 px-3 py-2 text-sm focus:border-destructive focus:outline-none"
                  />
                </div>
                {adminDelete.error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
                    {adminDelete.error.message}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={
                      deleteConfirmName !== activeProvider.name ||
                      adminDelete.isPending
                    }
                    className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {adminDelete.isPending
                      ? "Suppression..."
                      : "Supprimer définitivement"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
