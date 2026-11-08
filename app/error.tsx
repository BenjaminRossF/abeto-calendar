"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-medium text-primary">No pudimos abrir esta página</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Algo salió mal</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Vuelve a intentarlo. Si el problema continúa, recarga la página más tarde.
      </p>
      <Button className="mt-6" onClick={retry} type="button">Intentar de nuevo</Button>
    </main>
  );
}
