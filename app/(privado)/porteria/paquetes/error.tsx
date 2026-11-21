"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex flex-col items-start gap-3">
      <p role="alert">No pudimos cargar los paquetes. Intenta de nuevo.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Reintentar
      </button>
    </div>
  );
}
