import "server-only";
import { apiFetch } from "@/lib/api";
import type { OpcionesPerfil, PerfilDirectorio } from "@/lib/types/perfil-directorio";

export type PerfilResultado =
  | { status: "ok"; data: PerfilDirectorio }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "error" };

const RUTA = "directorio/mi-perfil";

const esPerfil = (x: unknown): x is PerfilDirectorio =>
  !!x &&
  typeof (x as PerfilDirectorio).visible === "boolean" &&
  typeof (x as PerfilDirectorio).misDatos === "object" &&
  (x as PerfilDirectorio).misDatos !== null;

// Traduce la respuesta HTTP (mismo contrato que lib/visitas). Nunca lanza por
// fallos de red o JSON inesperado; el redirect() de apiFetch (401) sí se propaga.
async function llamar(init?: RequestInit): Promise<PerfilResultado> {
  let res: Response;
  try {
    res = await apiFetch(RUTA, init);
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
  return esPerfil(body) ? { status: "ok", data: body } : { status: "error" };
}

export const getMiPerfil = () => llamar();

export const guardarMiPerfil = (o: OpcionesPerfil) =>
  llamar({
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(o),
  });
