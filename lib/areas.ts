import "server-only";
import { apiFetch } from "@/lib/api";
import type { Area, DatosArea } from "@/lib/types/areas";

export type AreasResultado<T> =
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
): Promise<AreasResultado<T>> {
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

const esArea = (x: unknown): x is Area =>
  !!x &&
  typeof (x as Area).id === "string" &&
  typeof (x as Area).activa === "boolean";

const conJson = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const ruta = (id: string) => `areas/${encodeURIComponent(id)}`;

export const getAreas = () =>
  llamar<Area[]>("areas", undefined, (b) => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) ? (datos as Area[]) : null;
  });

export const crearArea = (datos: DatosArea) =>
  llamar<Area>("areas", conJson("POST", datos), (b) => (esArea(b) ? b : null));

export const actualizarArea = (id: string, datos: DatosArea) =>
  llamar<Area>(ruta(id), conJson("PUT", datos), (b) =>
    esArea(b) ? b : null,
  );

export const cambiarEstadoArea = (id: string, activa: boolean) =>
  llamar<Area>(`${ruta(id)}/estado`, conJson("PATCH", { activa }), (b) =>
    esArea(b) ? b : null,
  );
