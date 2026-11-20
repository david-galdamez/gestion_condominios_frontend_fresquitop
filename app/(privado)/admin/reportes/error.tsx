"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert">No pudimos cargar los reportes. Intenta de nuevo.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Reintentar
      </button>
    </div>
  );
}