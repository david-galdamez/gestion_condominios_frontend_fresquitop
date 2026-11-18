import { describe, expect, it } from "vitest";
import {
  aEntradaSinCodigo,
  claveDeConflicto,
  erroresDesdeApi,
  formatHora,
  MSG,
  validarBusqueda,
  validarMotivo,
  validarVisitante,
} from "./acceso";

const valido = {
  nombre: "Ana López",
  tipoDocumento: "DUI",
  numeroDocumento: "01234567-8",
  unidadId: "u-1",
  motivo: "Entrega de documentos",
};

describe("validarVisitante", () => {
  it("acepta un visitante completo", () => {
    expect(validarVisitante(valido)).toEqual({});
  });

  it("reporta cada campo faltante con su mensaje", () => {
    expect(
      validarVisitante({ nombre: "", tipoDocumento: "DUI", numeroDocumento: "1", unidadId: "", motivo: "" }),
    ).toEqual({
      nombre: MSG.nombre,
      numeroDocumento: MSG.documento,
      unidadId: MSG.unidad,
      motivo: MSG.motivo,
    });
  });

  it.each([
    ["Hola", false],
    ["Hola!", true],
    ["a".repeat(100), true],
    ["a".repeat(101), false],
    ["      ", false],
  ])("motivo %j -> válido=%s", (m, ok) => {
    expect(validarMotivo(m)).toBe(ok ? undefined : MSG.motivo);
  });
});

it("aEntradaSinCodigo recorta y pasa el pasaporte a mayúsculas", () => {
  expect(
    aEntradaSinCodigo({ ...valido, nombre: " Ana ", tipoDocumento: "PASAPORTE", numeroDocumento: " ab123456 " }),
  ).toEqual({
    nombre: "Ana",
    tipoDocumento: "PASAPORTE",
    numeroDocumento: "AB123456",
    unidadId: "u-1",
    motivo: "Entrega de documentos",
  });
});

it("erroresDesdeApi ubica los mensajes del backend", () => {
  expect(erroresDesdeApi([MSG.motivo, "Otro"])).toEqual({
    errores: { motivo: MSG.motivo },
    resto: ["Otro"],
  });
});

it("validarBusqueda exige de 3 a 12 caracteres", () => {
  expect(validarBusqueda(" 048213 ")).toBeUndefined();
  expect(validarBusqueda("ab")).toBe(MSG.busqueda);
  expect(validarBusqueda("1234567890123")).toBe(MSG.busqueda);
});

it("formatHora usa la hora de El Salvador en 24 h", () => {
  expect(formatHora("2026-11-11T20:05:00.000Z")).toBe("14:05");
  expect(formatHora("no-es-fecha")).toBe("");
});

it("claveDeConflicto reconoce los 409 del backend", () => {
  expect(claveDeConflicto("Código no válido: está usado")).toBe("usado");
  expect(claveDeConflicto("Código no válido: está vencido")).toBe("vencido");
  expect(claveDeConflicto("Este visitante ya registró su salida")).toBe("ya_salio");
  expect(claveDeConflicto("otro")).toBeUndefined();
});
