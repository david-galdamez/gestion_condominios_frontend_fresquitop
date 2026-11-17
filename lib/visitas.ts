import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  Autorizacion,
  CambiosAutorizacion,
  NuevaAutorizacion,
  UnidadMia,
} from "@/lib/types/visitas";

export type VisitasResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "conflict" }
  | { status: "error" };

// Traduce la respuesta HTTP al resultado discriminado. Nunca lanza por fallos
// de red o JSON inesperado; el redirect() de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<VisitasResultado<T>> {
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

const esAutorizacion = (x: unknown): x is Autorizacion =>
  !!x && typeof (x as Autorizacion).id === "string" && "codigo" in (x as object);

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getUnidadesMias = () =>
  llamar<UnidadMia[]>("unidades/mias", undefined, (b) =>
    Array.isArray(b) ? (b as UnidadMia[]) : null,
  );

export const getMisAutorizaciones = () =>
  llamar<Autorizacion[]>("autorizaciones/mias", undefined, (b) => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) ? (datos as Autorizacion[]) : null;
  });

export const crearAutorizacion = (datos: NuevaAutorizacion) =>
  llamar<Autorizacion>("autorizaciones", json(datos), (b) =>
    esAutorizacion(b) ? b : null,
  );

export const cancelarAutorizacion = (id: string) =>
  llamar<Autorizacion>(
    `autorizaciones/${encodeURIComponent(id)}/cancelar`,
    { method: "PATCH" },
    (b) => (esAutorizacion(b) ? b : null),
  );

export const getAutorizacion = (id: string) =>
  llamar<Autorizacion>(
    `autorizaciones/${encodeURIComponent(id)}`,
    undefined,
    (b) => (esAutorizacion(b) ? b : null),
  );

export const editarAutorizacion = (id: string, datos: CambiosAutorizacion) =>
  llamar<Autorizacion>(
    `autorizaciones/${encodeURIComponent(id)}`,
    json(datos, "PATCH"),
    (b) => (esAutorizacion(b) ? b : null),
  );
