import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  Comunicado,
  NuevoComunicado,
  Torre,
} from "@/lib/types/comunicados";

export type ComunicadosResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "error" };

// Mismo contrato que lib/visitas y lib/areas: nunca lanza por red o JSON
// inesperado; el redirect() de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<ComunicadosResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) return { status: "not_found" };
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

const esComunicado = (x: unknown): x is Comunicado =>
  !!x &&
  typeof (x as Comunicado).id === "string" &&
  typeof (x as Comunicado).estado === "string";

export const getComunicados = () =>
  llamar<Comunicado[]>("comunicados", undefined, (b) => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) ? (datos as Comunicado[]) : null;
  });

export const getTorres = () =>
  llamar<Torre[]>("torres", undefined, (b) =>
    Array.isArray(b) ? (b as Torre[]) : null,
  );

export const crearComunicado = (datos: NuevoComunicado) =>
  llamar<Comunicado>(
    "comunicados",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    },
    (b) => (esComunicado(b) ? b : null),
  );
