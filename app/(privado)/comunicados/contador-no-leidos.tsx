"use client";

import { useEffect, useState } from "react";
import { contarNoLeidos } from "@/app/actions/comunicados";

export const INTERVALO_CONTADOR_MS = 30_000;

// Se consulta al abrir la pantalla (también al volver con el botón Atrás) y
// cada 30 segundos. Si una consulta falla se conserva el último valor.
export function ContadorNoLeidos({ inicial }: { inicial: number | null }) {
  const [noLeidos, setNoLeidos] = useState(inicial);

  useEffect(() => {
    let activo = true;
    const actualizar = async () => {
      const n = await contarNoLeidos();
      if (activo && n !== null) setNoLeidos(n);
    };
    void actualizar();
    const id = setInterval(actualizar, INTERVALO_CONTADOR_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  if (noLeidos === null) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={
        noLeidos > 0
          ? "rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white"
          : "rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }
    >
      {noLeidos === 0 ? "Sin pendientes" : `${noLeidos} sin leer`}
    </span>
  );
}
