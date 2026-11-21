"use server";

import { revalidatePath } from "next/cache";
import { horaActualEnElSalvador, hoyEnElSalvador } from "@/lib/format";
import { cancelarReserva, crearReserva } from "@/lib/reservas";
import type { Reserva } from "@/lib/types/reservas";
import {
  erroresDesdeApi,
  MSG,
  validarReserva,
  type ErroresReserva,
} from "@/lib/validaciones/reserva";

export type CrearReservaState = {
  status: "idle" | "error" | "ok";
  errores?: ErroresReserva;
  // Errores de la API (o genéricos) que se muestran arriba del formulario.
  mensajes?: string[];
  reserva?: Reserva;
};

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function crearReservaAction(
  _prev: CrearReservaState,
  formData: FormData,
): Promise<CrearReservaState> {
  const campos = {
    areaId: texto(formData, "areaId"),
    fecha: texto(formData, "fecha"),
    horaInicio: texto(formData, "horaInicio"),
    horaFin: texto(formData, "horaFin"),
    asistentes: texto(formData, "asistentes"),
  };

  // Nunca se confía en el cliente: se valida de nuevo antes de llamar a la API.
  // Las reglas que dependen del área (horario, duración, capacidad) las aplica
  // el backend.
  const errores = validarReserva(campos, undefined, {
    hoy: hoyEnElSalvador(),
    hora: horaActualEnElSalvador(),
  });
  if (Object.keys(errores).length > 0) return { status: "error", errores };

  const r = await crearReserva({
    areaId: campos.areaId,
    fecha: campos.fecha,
    horaInicio: campos.horaInicio,
    horaFin: campos.horaFin,
    asistentes: Number(campos.asistentes),
  });

  switch (r.status) {
    case "ok":
      revalidatePath("/reservas");
      return { status: "ok", reserva: r.data };
    case "conflict":
      return { status: "error", mensajes: [r.message ?? MSG.ocupado] };
    case "bad_request": {
      const api = erroresDesdeApi(r.messages);
      return {
        status: "error",
        errores: api.errores,
        ...(api.resto.length > 0 ? { mensajes: api.resto } : {}),
      };
    }
    case "not_found":
      return {
        status: "error",
        mensajes: ["El área no existe o está inactiva"],
      };
    case "forbidden":
      return { status: "error", mensajes: ["No tienes permiso para esta acción"] };
    default:
      return {
        status: "error",
        mensajes: ["No pudimos guardar la reserva. Intenta de nuevo."],
      };
  }
}

export type CancelarReservaResultado = { ok: true } | { ok: false; error: string };

export async function cancelarReservaAction(
  id: string,
): Promise<CancelarReservaResultado> {
  const r = await cancelarReserva(id);
  switch (r.status) {
    case "ok":
      revalidatePath("/reservas");
      return { ok: true };
    case "conflict":
      // Con menos de 24 h (o ya cancelada): se refresca la lista igual.
      revalidatePath("/reservas");
      return { ok: false, error: r.message ?? MSG.cancelarTarde };
    case "not_found":
      revalidatePath("/reservas");
      return { ok: false, error: "La reserva no existe" };
    case "forbidden":
      return { ok: false, error: "No tienes permiso para esta acción" };
    default:
      return { ok: false, error: "No pudimos cancelar la reserva. Intenta de nuevo." };
  }
}
