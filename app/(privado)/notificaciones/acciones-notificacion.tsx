"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "@/app/actions/notificaciones";

const btn =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-60 dark:border-zinc-700";

// Título de la notificación: enlaza a su destino y, al abrirla, la marca como
// leída. Sin destino se muestra como texto.
export function TituloNotificacion({
  id,
  href,
  leida,
  children,
}: {
  id: string;
  href: string | null;
  leida: boolean;
  children: ReactNode;
}) {
  if (!href) return <p className="font-medium break-words">{children}</p>;
  return (
    <Link
      href={href}
      onClick={() => {
        if (!leida) void marcarNotificacionLeida(id);
      }}
      className="font-medium break-words underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}

export function MarcarLeidaButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          start(async () => {
            const r = await marcarNotificacionLeida(id);
            setError(r.ok ? undefined : r.error);
          })
        }
      >
        {pending ? "Marcando..." : "Marcar como leída"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function MarcarTodasButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending || disabled}
        className={btn}
        onClick={() =>
          start(async () => {
            const r = await marcarTodasNotificacionesLeidas();
            setError(r.ok ? undefined : r.error);
          })
        }
      >
        {pending ? "Marcando..." : "Marcar todas como leídas"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
