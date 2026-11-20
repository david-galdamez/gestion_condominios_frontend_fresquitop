import "server-only";
import { apiFetch } from "@/lib/api";
import type { Disponibilidad } from "@/lib/types/disponibilidad";

export type DisponibilidadResultado =
  | { status: "ok"; data: Disponibilidad }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "error" };

const esDisponibilidad = (x: unknown): x is Disponibilidad =>
  !!x &&
  typeof (x as Disponibilidad).fecha === "string" &&
  Array.isArray((x as Disponibilidad).areas);

// BE-23.1: GET /api/v1/areas/disponibilidad?fecha= (solo Residente).
// Nunca lanza por fallos de red o JSON inesperado; el redirect() de apiFetch
// (401) sí se propaga.
export async function getDisponibilidad(
  fecha: string,
): Promise<DisponibilidadResultado> {
  let res: Response;
  try {
    res = await apiFetch(
      `areas/disponibilidad?${new URLSearchParams({ fecha }).toString()}`,
    );
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };
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
  return esDisponibilidad(body)
    ? { status: "ok", data: body }
    : { status: "error" };
}
