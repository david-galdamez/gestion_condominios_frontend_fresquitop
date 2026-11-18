"use server";

import { revalidatePath } from "next/cache";
import { hoyEnElSalvador } from "@/lib/format";
import type { Autorizacion, TipoDocumento } from "@/lib/types/visitas";
import { validarVisita, type ErroresVisita } from "@/lib/validaciones/visita";
import {
  cancelarAutorizacion,
  crearAutorizacion,
  editarAutorizacion,
} from "@/lib/visitas";

export type CrearVisitaState = {
  status: "idle" | "error" | "ok";
  errores?: ErroresVisita;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
  autorizacion?: Autorizacion;
  // Solo al editar: el código cambió porque cambió la fecha.
  codigoNuevo?: boolean;
};

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");

const leerCampos = (formData: FormData) => ({
  unidadId: texto(formData, "unidadId"),
  nombre: texto(formData, "nombre").trim(),
  tipoDocumento: texto(formData, "tipoDocumento"),
  numeroDocumento: texto(formData, "numeroDocumento").trim(),
  placa: texto(formData, "placa").trim(),
  fechaVisita: texto(formData, "fechaVisita"),
  horaEstimada: texto(formData, "horaEstimada"),
});

const normalizarDocumento = (tipo: string, numero: string) =>
  tipo === "PASAPORTE" ? numero.toUpperCase() : numero;

export async function crearVisita(
  _prev: CrearVisitaState,
  formData: FormData,
): Promise<CrearVisitaState> {
  const campos = leerCampos(formData);

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  const errores = validarVisita(campos, hoyEnElSalvador());
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await crearAutorizacion({
    unidadId: campos.unidadId,
    nombre: campos.nombre,
    tipoDocumento: campos.tipoDocumento as TipoDocumento,
    numeroDocumento: normalizarDocumento(
      campos.tipoDocumento,
      campos.numeroDocumento,
    ),
    ...(campos.placa ? { placa: campos.placa } : {}),
    fechaVisita: campos.fechaVisita,
    horaEstimada: campos.horaEstimada,
  });

  switch (r.status) {
    case "ok":
      revalidatePath("/visitas");
      return { status: "ok", autorizacion: r.data };
    case "bad_request":
      return { status: "error", mensajes: r.messages };
    case "forbidden":
      return { status: "error", mensajes: ["No tienes permiso para esta acción"] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos autorizar la visita. Intenta de nuevo."],
      };
  }
}

// H07b. Se usa con .bind(null, id, codigoAnterior) desde el formulario.
export async function editarVisita(
  id: string,
  codigoAnterior: string,
  _prev: CrearVisitaState,
  formData: FormData,
): Promise<CrearVisitaState> {
  const campos = leerCampos(formData);
  const errores = validarVisita(campos, hoyEnElSalvador());
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await editarAutorizacion(id, {
    nombre: campos.nombre,
    tipoDocumento: campos.tipoDocumento as TipoDocumento,
    numeroDocumento: normalizarDocumento(
      campos.tipoDocumento,
      campos.numeroDocumento,
    ),
    // Vacío = quitar la placa.
    placa: campos.placa || null,
    fechaVisita: campos.fechaVisita,
    horaEstimada: campos.horaEstimada,
  });

  switch (r.status) {
    case "ok":
      revalidatePath("/visitas");
      return {
        status: "ok",
        autorizacion: r.data,
        codigoNuevo: r.data.codigo !== codigoAnterior,
      };
    case "bad_request":
      return { status: "error", mensajes: r.messages };
    case "conflict":
      return {
        status: "error",
        mensajes: ["Esta autorización ya no se puede editar"],
      };
    case "not_found":
      return { status: "error", mensajes: ["La autorización no existe"] };
    case "forbidden":
      return { status: "error", mensajes: ["No tienes permiso para esta acción"] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos guardar los cambios. Intenta de nuevo."],
      };
  }
}

export type CancelarVisitaResultado = { ok: true } | { ok: false; error: string };

export async function cancelarVisita(id: string): Promise<CancelarVisitaResultado> {
  const r = await cancelarAutorizacion(id);
  switch (r.status) {
    case "ok":
      revalidatePath("/visitas");
      return { ok: true };
    case "conflict":
      // La lista queda desactualizada (p. ej. ya se usó): se refresca igual.
      revalidatePath("/visitas");
      return { ok: false, error: "Esta autorización ya no se puede cancelar" };
    case "not_found":
      revalidatePath("/visitas");
      return { ok: false, error: "La autorización no existe" };
    case "forbidden":
      return { ok: false, error: "No tienes permiso para esta acción" };
    default:
      return { ok: false, error: "No pudimos cancelar la autorización. Intenta de nuevo." };
  }
}
