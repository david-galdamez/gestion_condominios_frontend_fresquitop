import { describe, expect, it } from "vitest";
import {
  erroresDesdeApi,
  mascaraTarjeta,
  mascaraVencimiento,
  MSG,
  tarjetaParaApi,
  totalSeleccion,
  validarCvv,
  validarNumero,
  validarPago,
  validarTitular,
  validarVencimiento,
} from "./pago";

const valida = { numero: "4242 4242 4242 4242", vencimiento: "12/28", cvv: "123", titular: "Ana López" };

describe("validaciones de pago", () => {
  it("máscaras de tarjeta y vencimiento", () => {
    expect(mascaraTarjeta("4242424242424242999")).toBe("4242 4242 4242 4242");
    expect(mascaraTarjeta("42a42")).toBe("4242");
    expect(mascaraVencimiento("1228")).toBe("12/28");
    expect(mascaraVencimiento("12")).toBe("12");
    expect(mascaraVencimiento("1/2/2/8")).toBe("12/28");
  });

  it("número: 16 dígitos con o sin espacios", () => {
    expect(validarNumero("4242 4242 4242 4242")).toBeUndefined();
    expect(validarNumero("4242424242424242")).toBeUndefined();
    expect(validarNumero("4242 4242")).toBe(MSG.numero);
    expect(validarNumero("4242-4242-4242-4242")).toBe(MSG.numero);
  });

  it("vencimiento: MM/AA no anterior al mes actual", () => {
    expect(validarVencimiento("11/26", "2026-11")).toBeUndefined();
    expect(validarVencimiento("01/27", "2026-11")).toBeUndefined();
    expect(validarVencimiento("10/26", "2026-11")).toBe(MSG.vencimiento);
    expect(validarVencimiento("13/27", "2026-11")).toBe(MSG.vencimiento);
    expect(validarVencimiento("1227", "2026-11")).toBe(MSG.vencimiento);
  });

  it("CVV de 3 dígitos y titular de 3 a 60", () => {
    expect(validarCvv("123")).toBeUndefined();
    expect(validarCvv("12")).toBe(MSG.cvv);
    expect(validarTitular("  Al ")).toBe(MSG.titular);
    expect(validarTitular("a".repeat(61))).toBe(MSG.titular);
  });

  it("validarPago exige al menos una cuota y devuelve solo los errores", () => {
    expect(validarPago(["c1"], valida, "2026-11")).toEqual({});
    expect(validarPago([], { ...valida, cvv: "" }, "2026-11")).toEqual({ cuotas: MSG.cuotas, cvv: MSG.cvv });
  });

  it("total: suma en centavos solo de las marcadas", () => {
    const cuotas = [
      { id: "a", monto: 45.1 },
      { id: "b", monto: 45.2 },
      { id: "c", monto: 60 },
    ];
    expect(totalSeleccion(cuotas, ["a", "b"])).toBe(90.3);
    expect(totalSeleccion(cuotas, [])).toBe(0);
  });

  it("tarjetaParaApi quita espacios y recorta el titular", () => {
    expect(tarjetaParaApi({ ...valida, titular: " Ana " })).toEqual({
      numero: "4242424242424242",
      vencimiento: "12/28",
      cvv: "123",
      titular: "Ana",
    });
  });

  it("erroresDesdeApi ubica los mensajes conocidos", () => {
    expect(erroresDesdeApi([MSG.cvv, "otro"])).toEqual({ errores: { cvv: MSG.cvv }, resto: ["otro"] });
  });
});
