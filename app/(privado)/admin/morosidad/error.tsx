// app/(privado)/admin/morosidad/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = () => {
    if (retry) {
      retry();
      return;
    }
    reset?.();
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert">
        No pudimos cargar el reporte de morosidad. Intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={handleRetry}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Reintentar
      </button>
    </div>
  );
}