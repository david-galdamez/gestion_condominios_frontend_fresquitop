"use client";

import { useEffect, useRef, useState } from "react";
import type { UnidadActiva } from "@/lib/types/usuarios";

// Dropdown de selección múltiple. Las casillas viven dentro del panel pero
// siguen en el DOM al cerrarlo, así que `unidadIds` se envía igual con el form.
export function SelectorUnidades({
  unidades,
  seleccion,
  onAlternar,
}: {
  unidades: UnidadActiva[];
  seleccion: string[];
  onAlternar: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const codigos = unidades
    .filter((u) => seleccion.includes(u.id))
    .map((u) => u.codigo);
  const resumen =
    codigos.length === 0
      ? "Selecciona unidades"
      : codigos.length <= 3
        ? codigos.join(", ")
        : `${codigos.length} unidades seleccionadas`;

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        id="unidades"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-left text-sm dark:border-zinc-700"
      >
        <span className={codigos.length === 0 ? "text-zinc-500" : undefined}>
          {resumen}
        </span>
        <span aria-hidden className="text-xs">
          {abierto ? "▲" : "▼"}
        </span>
      </button>

      <div
        role="listbox"
        aria-multiselectable
        hidden={!abierto}
        className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-300 bg-background p-1 shadow-lg dark:border-zinc-700"
      >
        {unidades.map((u) => (
          <label
            key={u.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <input
              type="checkbox"
              name="unidadIds"
              value={u.id}
              checked={seleccion.includes(u.id)}
              onChange={() => onAlternar(u.id)}
            />
            {u.codigo}
          </label>
        ))}
      </div>
    </div>
  );
}
