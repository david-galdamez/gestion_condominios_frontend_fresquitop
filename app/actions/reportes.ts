"use server";

import { revalidatePath } from "next/cache";
import { asignarReporteApi, resolverReporteApi } from "@/lib/reportes";
import type {
  AsignacionReporteRespuesta,
  PrioridadReporte,
  ResolverReporteRespuesta,
} from "@/lib/types/reportes";
import {
  MSG_ASIGNACION,
  validarAsignacionReporte,
} from "@/lib/validaciones/reporte-asignacion";
import {
  MSG_RESOLUCION,
  validarComentarioCierre,
} from "@/lib/validaciones/reporte-resolucion";

export type AsignarReporteState =
  | { status: "idle" }
  | {
      status: "ok";
      mensaje: string;
      asignacion: AsignacionReporteRespuesta;
    }
  | { status: "error"; mensaje: string };

export type ResolverReporteState =
  | { status: "idle" }
  | {
      status: "ok";
      mensaje: string;
      resolucion: ResolverReporteRespuesta;
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

export async function resolverReporteAction(
  reporteId: string,
  comentarioRaw: string,
): Promise<ResolverReporteState> {
  const comentario = comentarioRaw.trim();
  const errorValidacion = validarComentarioCierre(comentario);
  if (errorValidacion) {
    return { status: "error", mensaje: errorValidacion };
  }

  const r = await resolverReporteApi(reporteId, { comentario });

  switch (r.status) {
    case "ok":
      revalidatePath("/admin/reportes");
      revalidatePath(`/admin/reportes/${reporteId}`);
      revalidatePath("/reportes");
      revalidatePath(`/reportes/${r.data.numero}`);
      return {
        status: "ok",
        mensaje: MSG_RESOLUCION.resuelto,
        resolucion: r.data,
      };
    case "bad_request":
    case "conflict":
    case "not_found":
      return { status: "error", mensaje: r.message };
    case "forbidden":
      return { status: "error", mensaje: MSG_RESOLUCION.sinPermiso };
    default:
      return { status: "error", mensaje: MSG_RESOLUCION.errorGenerico };
  }
}