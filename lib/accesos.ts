import "server-only";
import { apiFetch } from "@/lib/api";
import type { Acceso, EntradaSinCodigo } from "@/lib/types/accesos";
import type { Autorizacion } from "@/lib/types/visitas";

// Igual que lib/areas, pero el 409 trae su mensaje: la API distingue
// "Código no válido: está usado/cancelado/vencido" y la salida repetida.
export type AccesosResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "conflict"; message: string }
  | { status: "error" };

async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<AccesosResultado<T>> {
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
    return { status: "conflict", message: typeof m === "string" ? m : "" };
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

const esAcceso = (x: unknown): x is Acceso =>
  !!x &&
  typeof (x as Acceso).id === "string" &&
  typeof (x as Acceso).horaEntrada === "string";

const lista =
  <T>(es: (x: unknown) => boolean) =>
  (b: unknown): T[] | null => {
    const datos = (b as { datos?: unknown } | null)?.datos;
    return Array.isArray(datos) && datos.every(es) ? (datos as T[]) : null;
  };

const esAutorizacion = (x: unknown) =>
  !!x && typeof (x as Autorizacion).codigo === "string";

const conJson = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const query = (q: string) => `?${new URLSearchParams({ q })}`;

// Autorizaciones de hoy por código o documento.
export const buscarAutorizacionesDeHoy = (q: string) =>
  llamar<Autorizacion[]>(
    `autorizaciones/buscar${query(q)}`,
    undefined,
    lista<Autorizacion>(esAutorizacion),
  );

// Visitantes que siguen dentro, por documento o por el código con que entraron.
export const buscarDentro = (q: string) =>
  llamar<Acceso[]>(`accesos/buscar${query(q)}`, undefined, lista<Acceso>(esAcceso));

export const registrarEntradaConCodigo = (codigo: string) =>
  llamar<Acceso>("accesos/entrada", conJson("POST", { codigo }), (b) =>
    esAcceso(b) ? b : null,
  );

export const registrarEntradaSinCodigo = (datos: EntradaSinCodigo) =>
  llamar<Acceso>("accesos/entrada", conJson("POST", datos), (b) =>
    esAcceso(b) ? b : null,
  );

export const registrarSalida = (id: string) =>
  llamar<Acceso>(
    `accesos/${encodeURIComponent(id)}/salida`,
    { method: "PATCH" },
    (b) => (esAcceso(b) ? b : null),
  );
