import "server-only";
import { apiFetch } from "@/lib/api";
import { getAreas } from "@/lib/areas";
import type { NuevaReserva, Reserva } from "@/lib/types/reservas";

export type ReservasResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  // 409: el backend manda el motivo ("Ese horario ya está reservado",
  // "Ya no puedes cancelar esta reserva").
  | { status: "conflict"; message?: string }
  | { status: "error" };

// Traduce la respuesta HTTP al resultado discriminado (mismo contrato que
// lib/visitas). Nunca lanza por fallos de red o JSON inesperado; el
// redirect() de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<ReservasResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    return typeof m === "string" ? { status: "conflict", message: m } : { status: "conflict" };
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const messages = Array.isArray(m)
      ? m.map(String)
      : typeof m === "string"
        ? [m]
        : ["Los datos no son válidos"];
    return { status: "bad_request", messages };
  }
  if (!res.ok) return { status: "error" };

  const body = await res.json().catch(() => null);
  const data = extraer(body);
  return data === null ? { status: "error" } : { status: "ok", data };
}

const esReserva = (x: unknown): x is Reserva =>
  !!x &&
  typeof (x as Reserva).id === "string" &&
  typeof (x as Reserva).codigo === "string";

// BE-4.1: POST /api/v1/reservas (Residente). 201 con la reserva Confirmada.
export const crearReserva = (datos: NuevaReserva) =>
  llamar<Reserva>(
    "reservas",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    },
    (b) => (esReserva(b) ? b : null),
  );

// BE-4.2: GET /api/v1/reservas/mias -> { datos: Reserva[] }
export const getMisReservas = () =>
  llamar<Reserva[]>("reservas/mias", undefined, (b) => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) ? (datos as Reserva[]) : null;
  });

// BE-4.2: PATCH /api/v1/reservas/{id}/cancelar. 409 si faltan menos de 24 h.
export const cancelarReserva = (id: string) =>
  llamar<Reserva>(
    `reservas/${encodeURIComponent(id)}/cancelar`,
    { method: "PATCH" },
    (b) => (esReserva(b) ? b : null),
  );

// Áreas para el selector del formulario. El residente solo recibe las activas
// (GET /api/v1/areas); igual se filtra por si el backend manda todas.
export async function getAreasReservables() {
  const r = await getAreas();
  return r.status === "ok"
    ? { ...r, data: r.data.filter((a) => a.activa) }
    : r;
}
