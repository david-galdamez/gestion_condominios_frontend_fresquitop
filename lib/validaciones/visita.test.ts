import { describe, expect, it } from "vitest";
import {
  mascaraDui,
  MSG,
  validarDocumento,
  validarFecha,
  validarHora,
  validarNombre,
  validarPlaca,
  validarUnidad,
  validarVisita,
  type CamposVisita,
} from "./visita";

const hoy = "2026-11-04";
const valido: CamposVisita = {
  unidadId: "u1",
  nombre: "Ana Pérez",
  tipoDocumento: "DUI",
  numeroDocumento: "12345678-9",
  placa: "",
  fechaVisita: "2026-11-10",
  horaEstimada: "14:30",
};

describe("validadores", () => {
  it("nombre 3 a 60 con trim", () => {
    expect(validarNombre("ab")).toBe(MSG.nombre);
    expect(validarNombre("  ab  ")).toBe(MSG.nombre);
    expect(validarNombre("abc")).toBeUndefined();
    expect(validarNombre("a".repeat(60))).toBeUndefined();
    expect(validarNombre("a".repeat(61))).toBe(
      "El nombre debe tener entre 3 y 60 caracteres",
    );
  });

  it("DUI", () => {
    expect(validarDocumento("DUI", "12345678-9")).toBeUndefined();
    for (const m of ["123456789", "1234567-89", "12345678-", "1234567a-9"]) {
      expect(validarDocumento("DUI", m)).toBe(
        "El número de documento no tiene el formato correcto",
      );
    }
  });

  it("pasaporte tras pasar a mayúsculas", () => {
    expect(validarDocumento("PASAPORTE", "ab12cd")).toBeUndefined();
    expect(validarDocumento("PASAPORTE", "A".repeat(12))).toBeUndefined();
    expect(validarDocumento("PASAPORTE", "A".repeat(5))).toBe(MSG.documento);
    expect(validarDocumento("PASAPORTE", "A".repeat(13))).toBe(MSG.documento);
    expect(validarDocumento("PASAPORTE", "AB-1234")).toBe(MSG.documento);
    expect(validarDocumento("OTRO", "ABC123")).toBe(MSG.documento);
  });

  it("placa máx 10", () => {
    expect(validarPlaca("")).toBeUndefined();
    expect(validarPlaca("P".repeat(10))).toBeUndefined();
    expect(validarPlaca("P".repeat(11))).toBe(
      "La placa no puede superar los 10 caracteres",
    );
  });

  it("hora HH:mm", () => {
    for (const h of ["00:00", "23:59", "09:05"]) expect(validarHora(h)).toBeUndefined();
    for (const h of ["", "24:00", "12:60", "9:00", "12:5"]) {
      expect(validarHora(h)).toBe("Ingresa una hora válida");
    }
  });

  it("fecha en rango", () => {
    expect(validarFecha("2026-11-04", hoy)).toBeUndefined();
    expect(validarFecha("2026-12-04", hoy)).toBeUndefined();
    const msg = "Elige una fecha entre hoy y los próximos 30 días";
    expect(validarFecha("2026-11-03", hoy)).toBe(msg);
    expect(validarFecha("2026-12-05", hoy)).toBe(msg);
    expect(validarFecha("2026-02-30", hoy)).toBe(msg);
    expect(validarFecha("", hoy)).toBe(msg);
  });

  it("unidad", () => {
    expect(validarUnidad("")).toBe("Selecciona una unidad");
    expect(validarUnidad("u1")).toBeUndefined();
  });
});

describe("validarVisita", () => {
  it("devuelve {} si todo es válido", () => {
    expect(validarVisita(valido, hoy)).toEqual({});
  });
  it("devuelve un error por campo inválido", () => {
    const e = validarVisita(
      { ...valido, unidadId: "", nombre: "a", numeroDocumento: "1", placa: "x".repeat(11), fechaVisita: "", horaEstimada: "" },
      hoy,
    );
    expect(Object.keys(e).sort()).toEqual(
      ["fechaVisita", "horaEstimada", "nombre", "numeroDocumento", "placa", "unidadId"],
    );
  });
});

describe("mascaraDui", () => {
  it("pone el guion antes del último dígito solo con 9 dígitos", () => {
    expect(mascaraDui("123456789")).toBe("12345678-9");
    expect(mascaraDui("12345678")).toBe("12345678");
    expect(mascaraDui("")).toBe("");
  });
  it("quita no dígitos y recorta a 9", () => {
    expect(mascaraDui("12a34-5678-9999")).toBe("12345678-9");
    expect(mascaraDui("12345678-9")).toBe("12345678-9");
  });
});
