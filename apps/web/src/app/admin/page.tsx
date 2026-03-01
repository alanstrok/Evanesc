"use client";

import { trpc } from "@/lib/trpc";

export default function AdminPage() {
  const { data: providers, isLoading } =
    trpc.providers.adminList.useQuery();
  const utils = trpc.useUtils();

  const setVerified = trpc.providers.setVerified.useMutation({
    onSuccess: () => {
      utils.providers.adminList.invalidate();
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les prestataires et les listings
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Prestataires</h2>
        </div>

        {isLoading && (
          <p className="p-6 text-muted-foreground">Chargement...</p>
        )}

        <div className="divide-y divide-border">
          {providers?.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 lg:p-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{provider.name}</p>
                  {provider.isVerified && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
                      Vérifié
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {provider.category} — {provider.user.email}
                </p>
                {provider.address && (
                  <p className="text-xs text-muted-foreground">
                    {provider.address}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setVerified.mutate({
                    providerId: provider.id,
                    isVerified: !provider.isVerified,
                  })
                }
                disabled={setVerified.isPending}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  provider.isVerified
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-success hover:bg-success/90"
                }`}
              >
                {provider.isVerified ? "Retirer vérification" : "Vérifier"}
              </button>
            </div>
          ))}
        </div>

        {providers?.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            Aucun prestataire inscrit
          </p>
        )}
      </div>
    </div>
  );
}
