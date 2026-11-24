import { describe, expect, it } from "vitest";
import {
  MSG_AL_MENOS_UN_DATO,
  MSG_SIN_TELEFONO,
  MSG_TELEFONO,
  normalizarTelefono,
  opcionesDesdeFormData,
  PERFIL_OCULTO,
  validarPerfil,
  validarTelefono,
  vistaPrevia,
} from "./perfil-directorio";

const datos = { nombre: "Ana López", unidad: "A-101, B-205", telefono: null, correo: "ana@test.com" };

describe("validaciones de perfil de directorio", () => {
  it("visible exige al menos un dato; oculto no", () => {
    expect(validarPerfil(PERFIL_OCULTO)).toBeUndefined();
    expect(validarPerfil({ ...PERFIL_OCULTO, visible: true })).toBe(MSG_AL_MENOS_UN_DATO);
    expect(validarPerfil({ ...PERFIL_OCULTO, visible: true, mostrarCorreo: true })).toBeUndefined();
  });

  it("vista previa: null si está oculto; solo los marcados si está visible", () => {
    expect(vistaPrevia({ ...PERFIL_OCULTO, mostrarNombre: true }, datos)).toBeNull();
    expect(vistaPrevia({ ...PERFIL_OCULTO, visible: true, mostrarNombre: true, mostrarUnidad: true }, datos)).toEqual({
      nombre: "Ana López",
      unidad: "A-101, B-205",
      telefono: null,
      correo: null,
    });
  });

  it("lee las 5 opciones del FormData; si falta o es inválida devuelve null", () => {
    const f = new FormData();
    for (const k of ["visible", "mostrarNombre", "mostrarUnidad", "mostrarTelefono", "mostrarCorreo"]) f.set(k, "false");
    f.set("visible", "true");
    expect(opcionesDesdeFormData(f)).toEqual({ ...PERFIL_OCULTO, visible: true });
    f.set("mostrarCorreo", "si");
    expect(opcionesDesdeFormData(f)).toBeNull();
    f.delete("mostrarCorreo");
    expect(opcionesDesdeFormData(f)).toBeNull();
  });

  describe("teléfono (hotfix 1.0.1)", () => {
    it.each([
      ["70442727", "7044-2727"],
      [" 2222 3333 ", "2222-3333"],
      ["6123-4567", "6123-4567"],
      ["", null],
      ["   ", null],
    ])("normalizarTelefono(%j) -> %j", (entrada, esperado) => {
      expect(normalizarTelefono(entrada)).toBe(esperado);
    });

    it("validarTelefono: igual que el backend", () => {
      expect(validarTelefono("7044-2727")).toBeUndefined();
      expect(validarTelefono("")).toBeUndefined();
      for (const malo of ["1234-5678", "7044-272", "+503 7044 2727", "abc"]) {
        expect(validarTelefono(malo)).toBe(MSG_TELEFONO);
      }
    });

    it("validarPerfil: no se puede mostrar un teléfono vacío", () => {
      const o = { ...PERFIL_OCULTO, visible: true, mostrarTelefono: true };
      expect(validarPerfil(o, "")).toBe(MSG_SIN_TELEFONO);
      expect(validarPerfil(o, "7044-2727")).toBeUndefined();
      expect(validarPerfil(o, "123")).toBe(MSG_TELEFONO);
      // Sin teléfono (solo opciones) mantiene la regla original.
      expect(validarPerfil(o)).toBeUndefined();
    });
  });
});
