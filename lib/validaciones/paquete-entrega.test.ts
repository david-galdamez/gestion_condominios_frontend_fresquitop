import { describe, expect, it } from "vitest";
import {
  erroresEntregaDesdeApi,
  MSG_ENTREGA,
  validarCodigoRetiro,
  validarEntrega,
  validarRecibidoPor,
} from "./paquete";

describe("validaciones de entrega (H10)", () => {
  it("código de retiro: exactamente 6 dígitos", () => {
    expect(validarCodigoRetiro("482915")).toBeUndefined();
    for (const v of ["", "12345", "1234567", "12345a", "12 456"])
      expect(validarCodigoRetiro(v)).toBe(MSG_ENTREGA.codigo);
  });

  it("quien recibe: 3 a 60 caracteres sin contar espacios de los extremos", () => {
    expect(validarRecibidoPor("Ana")).toBeUndefined();
    expect(validarRecibidoPor("a".repeat(60))).toBeUndefined();
    expect(validarRecibidoPor("  ab  ")).toBe(MSG_ENTREGA.recibidoPor);
    expect(validarRecibidoPor("a".repeat(61))).toBe(MSG_ENTREGA.recibidoPor);
  });

  it("validarEntrega devuelve solo los campos con error", () => {
    expect(validarEntrega({ codigoRetiro: "482915", recibidoPor: "Carlos" })).toEqual({});
    expect(validarEntrega({ codigoRetiro: "1", recibidoPor: "" })).toEqual({
      codigoRetiro: MSG_ENTREGA.codigo,
      recibidoPor: MSG_ENTREGA.recibidoPor,
    });
  });

  it("erroresEntregaDesdeApi ubica el código incorrecto bajo su campo", () => {
    expect(erroresEntregaDesdeApi(["Código de retiro incorrecto", "otro"])).toEqual({
      errores: { codigoRetiro: "Código de retiro incorrecto" },
      resto: ["otro"],
    });
  });
});
