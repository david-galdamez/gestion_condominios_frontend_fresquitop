import { describe, expect, it } from "vitest";
import {
  MSG_AL_MENOS_UN_DATO,
  opcionesDesdeFormData,
  PERFIL_OCULTO,
  validarPerfil,
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
});
