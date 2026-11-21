import "server-only";
import { apiFetch } from "@/lib/api";
import type { DatosUnidad, DatosUsuario, Torre, UnidadActiva } from "@/lib/types/usuarios";

export type UsuariosResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "conflict" }
  | { status: "error" };

// Mismo contrato que lib/areas. Nunca lanza por red o JSON inesperado; el
// redirect() de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<UsuariosResultado<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch (e) {
    if (e instanceof Error && !("digest" in e)) return { status: "error" };
    throw e;
  }

  if (res.status === 403) return { status: "forbidden" };
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

// Unidades activas para el selector (GET /unidades permite ADMINISTRADOR).
export const getUnidadesActivas = () =>
  llamar<UnidadActiva[]>("unidades", undefined, (b) =>
    Array.isArray(b) ? (b as UnidadActiva[]) : null,
  );

export const crearUsuario = (datos: DatosUsuario) =>
  llamar<{ id: string }>(
    "users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    },
    (b) => (typeof (b as { id?: unknown } | null)?.id === "string" ? (b as { id: string }) : null),
  );

// Torres para el selector del alta de unidades (GET /torres, solo admin).
export const getTorres = () =>
  llamar<Torre[]>("torres", undefined, (b) =>
    Array.isArray(b) ? (b as Torre[]) : null,
  );

export const crearUnidad = (datos: DatosUnidad) =>
  llamar<UnidadActiva>(
    "unidades",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    },
    (b) => (typeof (b as { id?: unknown } | null)?.id === "string" ? (b as UnidadActiva) : null),
  );
