import "server-only";
import { apiFetch } from "@/lib/api";
import type {
  ConfiguracionCuota,
  DatosConfiguracion,
  ResultadoGeneracion,
} from "@/lib/types/cuotas";

export type CuotasResultado<T> =
  | { status: "ok"; data: T }
  | { status: "bad_request"; messages: string[] }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "conflict" }
  | { status: "error" };

// Traduce la respuesta HTTP al resultado discriminado (mismo contrato que
// lib/areas). Nunca lanza por fallos de red o JSON inesperado; el redirect()
// de apiFetch (401) sí se propaga.
async function llamar<T>(
  path: string,
  init: RequestInit | undefined,
  extraer: (body: unknown) => T | null,
): Promise<CuotasResultado<T>> {
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

const esConfiguracion = (x: unknown): x is ConfiguracionCuota =>
  !!x &&
  typeof (x as ConfiguracionCuota).montoMensual === "number" &&
  typeof (x as ConfiguracionCuota).diaVencimiento === "number" &&
  typeof (x as ConfiguracionCuota).vigenteDesde === "string";

const esResultado = (x: unknown): x is ResultadoGeneracion =>
  !!x &&
  typeof (x as ResultadoGeneracion).periodo === "string" &&
  typeof (x as ResultadoGeneracion).creadas === "number" &&
  typeof (x as ResultadoGeneracion).omitidas === "number";

const conJson = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// 404 = todavía no hay configuración guardada.
export const getConfiguracionCuota = () =>
  llamar<ConfiguracionCuota>("cuotas/configuracion", undefined, (b) =>
    esConfiguracion(b) ? b : null,
  );

export const guardarConfiguracionCuota = (datos: DatosConfiguracion) =>
  llamar<ConfiguracionCuota>(
    "cuotas/configuracion",
    conJson("PUT", datos),
    (b) => (esConfiguracion(b) ? b : null),
  );

// 409 = no existe configuración de cuota.
export const generarCuotas = (periodo: string) =>
  llamar<ResultadoGeneracion>(
    "cuotas/generar",
    conJson("POST", { periodo }),
    (b) => (esResultado(b) ? b : null),
  );
