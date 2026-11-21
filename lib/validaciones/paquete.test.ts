import { describe, expect, it } from "vitest";
import {
  erroresDesdeApi,
  etiquetaMensajeria,
  MAX_FOTO_BYTES,
  MSG,
  validarDestinatario,
  validarFoto,
  validarGuia,
  validarMensajeria,
  validarPaquete,
} from "./paquete";

const png = { type: "image/png", size: 1000 };
const validos = {
  unidadId: "u1",
  destinatario: "Carlos Pérez",
  mensajeria: "DHL",
  guia: "",
};

describe("validaciones de paquete", () => {
  it("destinatario 3 a 60 sin contar espacios de los extremos", () => {
    expect(validarDestinatario("Ana")).toBeUndefined();
    expect(validarDestinatario("a".repeat(60))).toBeUndefined();
    expect(validarDestinatario("  ab  ")).toBe(MSG.destinatario);
    expect(validarDestinatario("a".repeat(61))).toBe(MSG.destinatario);
  });

  it("mensajería solo de la lista", () => {
    for (const m of ["CORREOS", "DHL", "FEDEX", "UPS", "AMAZON", "OTRA"]) {
      expect(validarMensajeria(m)).toBeUndefined();
    }
    expect(validarMensajeria("")).toBe(MSG.mensajeria);
    expect(validarMensajeria("TNT")).toBe(MSG.mensajeria);
    expect(etiquetaMensajeria("FEDEX")).toBe("FedEx");
  });

  it("guía opcional hasta 40", () => {
    expect(validarGuia("")).toBeUndefined();
    expect(validarGuia("a".repeat(40))).toBeUndefined();
    expect(validarGuia("a".repeat(41))).toBe(MSG.guia);
  });

  it("foto: JPG o PNG de 1 byte a 5 MB", () => {
    expect(validarFoto(png)).toBeUndefined();
    expect(validarFoto({ type: "image/jpeg", size: MAX_FOTO_BYTES })).toBeUndefined();
    expect(validarFoto({ type: "image/png", size: MAX_FOTO_BYTES + 1 })).toBe(MSG.foto);
    expect(validarFoto({ type: "application/pdf", size: 10 })).toBe(MSG.foto);
    expect(validarFoto({ type: "image/heic", size: 10 })).toBe(MSG.foto);
    expect(validarFoto({ type: "image/png", size: 0 })).toBe(MSG.foto);
    expect(validarFoto(null)).toBe(MSG.foto);
  });

  it("validarPaquete devuelve solo los campos con error", () => {
    expect(validarPaquete(validos, png)).toEqual({});
    expect(validarPaquete({ ...validos, unidadId: "", destinatario: "a" }, null)).toEqual({
      unidadId: MSG.unidad,
      destinatario: MSG.destinatario,
      foto: MSG.foto,
    });
  });

  it("erroresDesdeApi ubica los mensajes conocidos bajo su campo", () => {
    expect(erroresDesdeApi([MSG.foto, MSG.guia, "otro"])).toEqual({
      errores: { foto: MSG.foto, guia: MSG.guia },
      resto: ["otro"],
    });
  });
});
