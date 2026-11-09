"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Vuelve a pedir la lista al servidor (llegan paquetes registrados por otro guardia).
export function ActualizarButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
    >
      {pending ? "Actualizando..." : "Actualizar"}
    </button>
  );
}
