"use server";

import { revalidatePath } from "next/cache";
import { generarCuotas, guardarConfiguracionCuota } from "@/lib/cuotas";
import type { ConfiguracionCuota } from "@/lib/types/cuotas";
import {
  aDatosConfiguracion,
  erroresDesdeApi,
  mensajesResultado,
  MSG,
  validarConfiguracion,
  validarPeriodo,
  type CamposConfiguracion,
  type ErroresConfiguracion,
} from "@/lib/validaciones/cuota";

const RUTA = "/admin/cuotas";
const SIN_PERMISO = "No tienes permiso para esta acción";
const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

export type GuardarConfiguracionState = {
  status: "idle" | "ok" | "error";
  configuracion?: ConfiguracionCuota;
  errores?: ErroresConfiguracion;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
};

export async function guardarConfiguracionAction(
  _prev: GuardarConfiguracionState,
  formData: FormData,
): Promise<GuardarConfiguracionState> {
  const campos: CamposConfiguracion = {
    montoMensual: texto(formData, "montoMensual"),
    diaVencimiento: texto(formData, "diaVencimiento"),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarConfiguracion(campos);
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await guardarConfiguracionCuota(aDatosConfiguracion(campos));
  switch (r.status) {
    case "ok":
      revalidatePath(RUTA);
      return { status: "ok", configuracion: r.data };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "forbidden":
      return { status: "error", mensajes: [SIN_PERMISO] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos guardar la configuración. Intenta de nuevo."],
      };
  }
}

export type GenerarCuotasState = {
  status: "idle" | "ok" | "error";
  // Resultado (ok) o errores (error), en el orden en que se muestran.
  mensajes?: string[];
};

export async function generarCuotasAction(
  _prev: GenerarCuotasState,
  formData: FormData,
): Promise<GenerarCuotasState> {
  const periodo = texto(formData, "periodo");
  const error = validarPeriodo(periodo);
  if (error) return { status: "error", mensajes: [error] };

  const r = await generarCuotas(periodo);
  switch (r.status) {
    case "ok":
      return { status: "ok", mensajes: mensajesResultado(r.data) };
    case "conflict":
      return {
        status: "error",
        mensajes: [`${MSG.sinConfiguracion}. Guárdala antes de generar.`],
      };
    case "bad_request":
      return { status: "error", mensajes: r.messages };
    case "forbidden":
      return { status: "error", mensajes: [SIN_PERMISO] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos generar las cuotas. Intenta de nuevo."],
      };
  }
}
