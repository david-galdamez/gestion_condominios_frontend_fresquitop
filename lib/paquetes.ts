import "server-only";
import { apiFetch } from "@/lib/api";
import type { Paquete, UnidadResumen } from "@/lib/types/paquetes";

export type PaquetesResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "conflict" }
  | { status: "error" };

// Traduce la respuesta HTTP al resultado discriminado (mismo contrato que
// lib/visitas). Nunca lanza por fallos de red o JSON inesperado; el
// redirect() de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<PaquetesResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 409) return { status: "conflict" };
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

const esPaquete = (x: unknown): x is Paquete =>
  !!x &&
  typeof (x as Paquete).id === "string" &&
  typeof (x as Paquete).codigoPaquete === "string";

// Todas las unidades activas (selector de portería).
export const getUnidades = () =>
  llamar<UnidadResumen[]>("unidades", undefined, (b) =>
    Array.isArray(b) ? (b as UnidadResumen[]) : null,
  );

// En portería y Retenidos, más recientes primero.
export const getPaquetesPorteria = () =>
  llamar<Paquete[]>("paquetes", undefined, (b) => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) ? (datos as Paquete[]) : null;
  });

// multipart/form-data: sin Content-Type explícito, fetch pone el boundary.
export const registrarPaquete = (datos: FormData) =>
  llamar<Paquete>("paquetes", { method: "POST", body: datos }, (b) =>
    esPaquete(b) ? b : null,
  );
