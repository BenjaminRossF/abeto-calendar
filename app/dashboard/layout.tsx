import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <BrandMark compact />
            <nav aria-label="Navegación principal" className="hidden items-center gap-5 sm:flex">
              <Link className="text-sm font-medium text-foreground transition-colors hover:text-primary" href="/dashboard" prefetch={true}>
                Mis eventos
              </Link>
            </nav>
          </div>
          <form action={signOutAction}>
            <Button size="sm" type="submit" variant="ghost">Cerrar sesión</Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        {children}
      </main>
    </div>
  );
}
