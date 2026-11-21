import { describe, expect, it } from "vitest";
import type { Area } from "@/lib/types/areas";
import {
  erroresDesdeApi,
  horasDelArea,
  MSG,
  msgCapacidad,
  msgDuracion,
  validarReserva,
  type CamposReserva,
} from "./reserva";

const area: Area = {
  id: "a1",
  nombre: "Alberca",
  capacidad: 20,
  horaApertura: "08:00",
  horaCierre: "22:00",
  duracionMaxHoras: 3,
  activa: true,
};
const ahora = { hoy: "2026-11-10", hora: 9 };
const ok: CamposReserva = {
  areaId: "a1",
  fecha: "2026-11-12",
  horaInicio: "10:00",
  horaFin: "12:00",
  asistentes: "12",
};

describe("validarReserva", () => {
  it("una reserva válida no tiene errores", () => {
    expect(validarReserva(ok, area, ahora)).toEqual({});
  });

  it("exige el área", () => {
    expect(validarReserva({ ...ok, areaId: "" }, area, ahora).areaId).toBe(MSG.area);
  });

  it("rechaza fecha vacía, imposible o pasada", () => {
    expect(validarReserva({ ...ok, fecha: "" }, area, ahora).fecha).toBe(MSG.fecha);
    expect(validarReserva({ ...ok, fecha: "2026-02-31" }, area, ahora).fecha).toBe(MSG.fecha);
    expect(validarReserva({ ...ok, fecha: "2026-11-09" }, area, ahora).fecha).toBe(
      "No puedes reservar en una fecha pasada",
    );
  });

  it("rechaza una hora que ya pasó el mismo día", () => {
    const c = { ...ok, fecha: "2026-11-10", horaInicio: "09:00", horaFin: "10:00" };
    expect(validarReserva(c, area, ahora).horaInicio).toBe(MSG.fechaPasada);
    const futura = { ...c, horaInicio: "10:00", horaFin: "11:00" };
    expect(validarReserva(futura, area, ahora)).toEqual({});
  });

  it("exige horas en punto", () => {
    const e = validarReserva({ ...ok, horaInicio: "10:30", horaFin: "" }, area, ahora);
    expect(e.horaInicio).toBe(MSG.horaInicio);
    expect(e.horaFin).toBe(MSG.horaFin);
  });

  it("el fin debe ser posterior al inicio", () => {
    expect(validarReserva({ ...ok, horaFin: "10:00" }, area, ahora).horaFin).toBe(
      MSG.finAntesDeInicio,
    );
    expect(validarReserva({ ...ok, horaFin: "09:00" }, area, ahora).horaFin).toBe(
      MSG.finAntesDeInicio,
    );
  });

  it("fuera del horario del área", () => {
    expect(
      validarReserva({ ...ok, horaInicio: "06:00", horaFin: "08:00" }, area, ahora).horaInicio,
    ).toBe("Fuera del horario del área");
    expect(
      validarReserva({ ...ok, horaInicio: "21:00", horaFin: "23:00" }, area, ahora).horaInicio,
    ).toBe("Fuera del horario del área");
  });

  it("supera la duración máxima", () => {
    expect(
      validarReserva({ ...ok, horaInicio: "10:00", horaFin: "14:00" }, area, ahora).horaFin,
    ).toBe("Supera la duración máxima de 3 horas");
  });

  it("supera la capacidad y asistentes inválidos", () => {
    expect(validarReserva({ ...ok, asistentes: "21" }, area, ahora).asistentes).toBe(
      "Supera la capacidad de 20 personas",
    );
    for (const v of ["", "0", "-2", "1.5", "abc"]) {
      expect(validarReserva({ ...ok, asistentes: v }, area, ahora).asistentes).toBe(
        MSG.asistentes,
      );
    }
  });

  it("sin área omite horario, duración y capacidad (lo valida el backend)", () => {
    const c = { ...ok, horaInicio: "06:00", horaFin: "14:00", asistentes: "500" };
    expect(validarReserva(c, undefined, ahora)).toEqual({});
  });
});

describe("mensajes con singular", () => {
  it("duración y capacidad", () => {
    expect(msgDuracion(1)).toBe("Supera la duración máxima de 1 hora");
    expect(msgCapacidad(1)).toBe("Supera la capacidad de 1 persona");
  });
});

describe("horasDelArea", () => {
  it("inicios hasta una hora antes del cierre; fines desde una hora después de la apertura", () => {
    const h = horasDelArea({ horaApertura: "08:00", horaCierre: "11:00" });
    expect(h.inicios).toEqual(["08:00", "09:00", "10:00"]);
    expect(h.fines).toEqual(["09:00", "10:00", "11:00"]);
  });
});

describe("erroresDesdeApi", () => {
  it("ubica los mensajes conocidos bajo su campo y deja el resto arriba", () => {
    const r = erroresDesdeApi([
      "No puedes reservar en una fecha pasada",
      "Fuera del horario del área",
      "Supera la duración máxima de 2 horas",
      "Supera la capacidad de 10 personas",
      "Otro problema",
    ]);
    expect(r.errores).toEqual({
      fecha: "No puedes reservar en una fecha pasada",
      horaInicio: "Fuera del horario del área",
      horaFin: "Supera la duración máxima de 2 horas",
      asistentes: "Supera la capacidad de 10 personas",
    });
    expect(r.resto).toEqual(["Otro problema"]);
  });
});
