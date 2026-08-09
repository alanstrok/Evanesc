"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

type Role = "customer" | "provider" | "admin";

export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const role = session?.user?.role as Role | undefined;
  const authorized = Boolean(role && allow.includes(role));

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user) {
      router.replace("/login");
    } else if (!authorized) {
      router.replace("/");
    }
  }, [isLoading, session, authorized, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}
