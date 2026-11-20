import { describe, expect, it } from "vitest";
import {
  MSG_ASIGNACION,
  validarAsignacionReporte,
} from "./reporte-asignacion";

describe("validarAsignacionReporte (H06)", () => {
  it("acepta prioridad y responsable válidos", () => {
    expect(
      validarAsignacionReporte({
        prioridad: "ALTA",
        responsable: "Fontanería López",
      }),
    ).toBeNull();
  });

  it.each([
    ["solo prioridad", { prioridad: "ALTA", responsable: "" }],
    ["solo responsable", { prioridad: "", responsable: "Fontanería López" }],
    ["responsable solo espacios", { prioridad: "MEDIA", responsable: "   " }],
    ["ambos vacíos", { prioridad: "", responsable: "" }],
  ])("rechaza %s con el mensaje exacto", (_caso, campos) => {
    expect(validarAsignacionReporte(campos)).toBe(MSG_ASIGNACION.incompleta);
  });

  it("rechaza responsable menor a 3 o mayor a 60 caracteres", () => {
    expect(
      validarAsignacionReporte({ prioridad: "BAJA", responsable: "AB" }),
    ).toBe(MSG_ASIGNACION.responsableLongitud);

    expect(
      validarAsignacionReporte({
        prioridad: "BAJA",
        responsable: "a".repeat(61),
      }),
    ).toBe(MSG_ASIGNACION.responsableLongitud);
  });

  it("rechaza una prioridad fuera de la lista permitida", () => {
    expect(
      validarAsignacionReporte({
        prioridad: "URGENTE",
        responsable: "Fontanería López",
      }),
    ).toBe(MSG_ASIGNACION.prioridadInvalida);
  });
});