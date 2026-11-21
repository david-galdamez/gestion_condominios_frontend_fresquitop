"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "idle" | "copiado" | "error";

type Props = { texto: string; etiqueta?: string };

export function CopiarBoton({ texto, etiqueta = "Copiar código" }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copiar() {
    let siguiente: Estado = "copiado";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("sin clipboard");
      await navigator.clipboard.writeText(texto);
    } catch {
      siguiente = "error";
    }
    setEstado(siguiente);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setEstado("idle"), 2000);
  }

  const mensaje =
    estado === "copiado"
      ? "¡Copiado!"
      : estado === "error"
        ? "No se pudo copiar"
        : etiqueta;

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <span aria-live="polite">{mensaje}</span>
    </button>
  );
}
