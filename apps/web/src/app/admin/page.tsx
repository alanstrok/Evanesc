"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@evanesc/ui";

export default function AdminPage() {
  const { data: providers } = trpc.providers.adminList.useQuery();
  const { data: allOffers } = trpc.offers.adminList.useQuery();

  const totalProviders = providers?.length ?? 0;
  const verifiedProviders =
    providers?.filter((p) => p.isVerified).length ?? 0;
  const totalOffers = allOffers?.length ?? 0;
  const activeOffers = allOffers?.filter((o) => o.isActive).length ?? 0;

  const stats = [
    { label: "Partenaires", value: totalProviders, icon: "🤝" },
    { label: "Vérifiés", value: verifiedProviders, icon: "✅" },
    { label: "Offres totales", value: totalOffers, icon: "🏷️" },
    { label: "Offres actives", value: activeOffers, icon: "📢" },
  ];

  // Category breakdown
  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: providers?.filter((p) => p.category === cat.value).length ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Tableau de bord admin
        </h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de la plateforme Evanesc
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-xl border border-border bg-white">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">Par catégorie</h2>
          </div>
          <div className="divide-y divide-border">
            {categoryCounts.map((cat) => (
              <div
                key={cat.value}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {cat.count} partenaire{cat.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent partners */}
        <div className="rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h2 className="text-lg font-semibold">Derniers partenaires</h2>
            <Link
              href="/admin/partners"
              className="text-sm text-accent hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-border">
            {providers?.slice(0, 5).map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{provider.name}</p>
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
                  <p className="text-xs text-muted-foreground">
                    {provider.user.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {
                    CATEGORIES.find((c) => c.value === provider.category)
                      ?.emoji
                  }{" "}
                  {
                    CATEGORIES.find((c) => c.value === provider.category)
                      ?.label
                  }
                </span>
              </div>
            ))}
            {(!providers || providers.length === 0) && (
              <p className="p-6 text-center text-muted-foreground">
                Aucun partenaire inscrit
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
