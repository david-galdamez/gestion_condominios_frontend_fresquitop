"use server";

import { revalidatePath } from "next/cache";
import { asignarReporteApi } from "@/lib/reportes";
import type {
  AsignacionReporteRespuesta,
  PrioridadReporte,
} from "@/lib/types/reportes";
import {
  MSG_ASIGNACION,
  validarAsignacionReporte,
} from "@/lib/validaciones/reporte-asignacion";

export type AsignarReporteState =
  | { status: "idle" }
  | {
      status: "ok";
      mensaje: string;
      asignacion: AsignacionReporteRespuesta;
    }
  | { status: "error"; mensaje: string };

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function asignarReporteAction(
  reporteId: string,
  _prev: AsignarReporteState,
  formData: FormData,
): Promise<AsignarReporteState> {
  const prioridad = texto(formData, "prioridad").trim();
  const responsable = texto(formData, "responsable").trim();

  const errorValidacion = validarAsignacionReporte({ prioridad, responsable });
  if (errorValidacion) {
    return { status: "error", mensaje: errorValidacion };
  }

  const r = await asignarReporteApi(reporteId, {
    prioridad: prioridad as PrioridadReporte,
    responsable,
  });

  switch (r.status) {
    case "ok":
      revalidatePath("/admin/reportes");
      revalidatePath(`/admin/reportes/${reporteId}`);
      return {
        status: "ok",
        mensaje: MSG_ASIGNACION.guardado,
        asignacion: r.data,
      };
    case "bad_request":
    case "conflict":
    case "not_found":
      return { status: "error", mensaje: r.message };
    case "forbidden":
      return { status: "error", mensaje: MSG_ASIGNACION.sinPermiso };
    default:
      return { status: "error", mensaje: MSG_ASIGNACION.errorGenerico };
  }
}