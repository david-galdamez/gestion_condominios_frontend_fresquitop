"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Vuelve a pedir los datos del servidor para la misma URL.
export function ReintentarButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Reintentando..." : "Reintentar"}
    </button>
  );
}