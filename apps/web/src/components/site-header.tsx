"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { signOut } from "@/lib/auth-client";

export function SiteHeader() {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const utils = trpc.useUtils();
  const role = session?.user?.role;

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold text-primary">
          Evanesc
        </Link>
        <nav className="flex items-center gap-3">
          {!isLoading && !session?.user && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Créer un compte
              </Link>
            </>
          )}
          {session?.user && (
            <>
              {role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              {(role === "provider" || role === "admin") && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Espace pro
                </Link>
              )}
              <Link
                href="/bookings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Mes réservations
              </Link>
              <button
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        utils.auth.getSession.invalidate();
                        window.location.href = "/";
                      },
                    },
                  })
                }
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Déconnexion
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
