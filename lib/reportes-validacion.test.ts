import { describe, expect, it } from "vitest";
import {
  MAX_FOTO_BYTES,
  MENSAJE_DESCRIPCION,
  MENSAJE_FOTOS,
  MENSAJE_TITULO,
  validarCampos,
  validarFoto,
} from "./reportes-validacion";

const valido = {
  titulo: "Fuga de agua",
  categoria: "FUGA",
  ubicacion: "Torre A",
  descripcion: "Hay una fuga en el pasillo.",
};

describe("validarCampos", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validarCampos(valido)).toEqual({});
  });

  it("valida el rango del título (5 a 80) sobre el texto recortado", () => {
    expect(validarCampos({ ...valido, titulo: "abcd" }).titulo).toBe(MENSAJE_TITULO);
    expect(validarCampos({ ...valido, titulo: "  ab  " }).titulo).toBe(MENSAJE_TITULO);
    expect(validarCampos({ ...valido, titulo: "x".repeat(81) }).titulo).toBe(MENSAJE_TITULO);
    expect(validarCampos({ ...valido, titulo: "x".repeat(5) }).titulo).toBeUndefined();
    expect(validarCampos({ ...valido, titulo: "x".repeat(80) }).titulo).toBeUndefined();
  });

  it("valida el rango de la descripción (10 a 500)", () => {
    expect(validarCampos({ ...valido, descripcion: "corta" }).descripcion).toBe(
      MENSAJE_DESCRIPCION,
    );
    expect(
      validarCampos({ ...valido, descripcion: "x".repeat(501) }).descripcion,
    ).toBe(MENSAJE_DESCRIPCION);
    expect(
      validarCampos({ ...valido, descripcion: "x".repeat(10) }).descripcion,
    ).toBeUndefined();
    expect(
      validarCampos({ ...valido, descripcion: "x".repeat(500) }).descripcion,
    ).toBeUndefined();
  });

  it("exige categoría y ubicación", () => {
    const e = validarCampos({ ...valido, categoria: "", ubicacion: "" });
    expect(e.categoria).toBeDefined();
    expect(e.ubicacion).toBeDefined();
  });
});

describe("validarFoto", () => {
  it("acepta JPG y PNG de hasta 5 MB", () => {
    expect(validarFoto({ type: "image/jpeg", size: 1000 }, 0)).toBeNull();
    expect(validarFoto({ type: "image/png", size: MAX_FOTO_BYTES }, 4)).toBeNull();
  });

  it("rechaza otros tipos de archivo", () => {
    expect(validarFoto({ type: "image/gif", size: 1000 }, 0)).toBe(MENSAJE_FOTOS);
    expect(validarFoto({ type: "application/pdf", size: 1000 }, 0)).toBe(MENSAJE_FOTOS);
  });

  it("rechaza archivos de más de 5 MB", () => {
    expect(validarFoto({ type: "image/png", size: MAX_FOTO_BYTES + 1 }, 0)).toBe(
      MENSAJE_FOTOS,
    );
  });

  it("rechaza una sexta foto", () => {
    expect(validarFoto({ type: "image/png", size: 1000 }, 5)).toBe(MENSAJE_FOTOS);
  });
});
