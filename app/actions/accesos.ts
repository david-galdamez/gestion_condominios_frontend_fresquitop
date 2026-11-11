"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  registrarEntradaConCodigo,
  registrarEntradaSinCodigo,
  registrarSalida,
} from "@/lib/accesos";
import {
  aEntradaSinCodigo,
  claveDeConflicto,
  erroresDesdeApi,
  ERRORES,
  formatHora,
  MSG,
  validarVisitante,
  type CamposVisitante,
  type ClaveError,
  type ErroresVisitante,
} from "@/lib/validaciones/acceso";

const RUTA = "/porteria/accesos";
const CODIGO = /^\d{6}$/;
const UUID = /^[0-9a-f-]{36}$/i;
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

// Éxito: vuelve a la búsqueda limpia para el siguiente visitante.
function exito(aviso: "entrada" | "salida", horaIso: string): never {
  revalidatePath(RUTA);
  redirect(`${RUTA}?${new URLSearchParams({ aviso, hora: formatHora(horaIso) })}`);
}

// Error: conserva la búsqueda para que el guardia vea el estado actual.
function fallo(error: ClaveError, q: string): never {
  const params = new URLSearchParams({ error });
  if (q) params.set("q", q);
  redirect(`${RUTA}?${params}`);
}

// FE-8.1: entrada con el código de la autorización.
export async function registrarEntradaCodigoAction(formData: FormData) {
  const codigo = texto(formData, "codigo");
  const q = texto(formData, "q");
  if (!CODIGO.test(codigo)) fallo("no_existe", q);

  const r = await registrarEntradaConCodigo(codigo);
  switch (r.status) {
    case "ok":
      exito("entrada", r.data.horaEntrada);
    case "conflict":
      fallo(claveDeConflicto(r.message) ?? "entrada", q);
    case "not_found":
      fallo("no_existe", q);
    case "forbidden":
      fallo("permiso", q);
    default:
      fallo("entrada", q);
  }
}

// FE-8.2: salida de un visitante que está dentro.
export async function registrarSalidaAction(formData: FormData) {
  const id = texto(formData, "id");
  const q = texto(formData, "q");
  if (!UUID.test(id)) fallo("no_registro", q);

  const r = await registrarSalida(id);
  switch (r.status) {
    case "ok":
      exito("salida", r.data.horaSalida ?? new Date().toISOString());
    case "conflict":
      fallo("ya_salio", q);
    case "not_found":
      fallo("no_registro", q);
    case "forbidden":
      fallo("permiso", q);
    default:
      fallo("salida", q);
  }
}

export type EntradaSinCodigoState = {
  status: "idle" | "error";
  errores?: ErroresVisitante;
  mensajes?: string[];
};

// FE-8.2: entrada de un visitante sin pre-autorización.
export async function registrarEntradaSinCodigoAction(
  _prev: EntradaSinCodigoState,
  formData: FormData,
): Promise<EntradaSinCodigoState> {
  const campos: CamposVisitante = {
    nombre: texto(formData, "nombre"),
    tipoDocumento: texto(formData, "tipoDocumento"),
    numeroDocumento: texto(formData, "numeroDocumento"),
    unidadId: texto(formData, "unidadId"),
    motivo: texto(formData, "motivo"),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarVisitante(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await registrarEntradaSinCodigo(aEntradaSinCodigo(campos));
  switch (r.status) {
    case "ok":
      exito("entrada", r.data.horaEntrada);
    case "not_found":
      return { status: "error", errores: { unidadId: MSG.unidad } };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "forbidden":
      return { status: "error", mensajes: [ERRORES.permiso] };
    default:
      return { status: "error", mensajes: [ERRORES.entrada] };
  }
}
