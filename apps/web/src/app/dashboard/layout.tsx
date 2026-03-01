"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: "📊" },
  { href: "/dashboard/offers", label: "Offres", icon: "🏷️" },
  { href: "/dashboard/bookings", label: "Réservations", icon: "📋" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Evanesc
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-4">
          <button
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.href = "/login" } })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Evanesc
          </Link>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg p-2 text-sm hover:bg-muted"
              >
                {item.icon}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 bg-muted p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
