import { describe, expect, it } from "vitest";
import {
  aDatosConfiguracion,
  erroresDesdeApi,
  mensajesResultado,
  MSG,
  periodoActual,
  periodosGenerables,
  sumarMeses,
  validarConfiguracion,
  validarDia,
  validarMonto,
  validarPeriodo,
} from "./cuota";

describe("validarMonto", () => {
  it.each(["1", "45", "45.5", "45.50", "9999.99", " 12.30 "])("acepta %s", (v) => {
    expect(validarMonto(v)).toBeUndefined();
  });
  it.each(["", "0.99", "10000", "45.123", "-5", "abc", "1,000"])("rechaza %s", (v) => {
    expect(validarMonto(v)).toBe(MSG.monto);
  });
});

describe("validarDia", () => {
  it.each(["1", "15", "28"])("acepta %s", (v) => expect(validarDia(v)).toBeUndefined());
  it.each(["", "0", "29", "10.5", "x"])("rechaza %s", (v) =>
    expect(validarDia(v)).toBe(MSG.dia),
  );
});

it("validarConfiguracion devuelve solo los campos con error y aDatos convierte a número", () => {
  expect(validarConfiguracion({ montoMensual: "45", diaVencimiento: "29" })).toEqual({
    diaVencimiento: MSG.dia,
  });
  expect(aDatosConfiguracion({ montoMensual: " 45.50 ", diaVencimiento: "10" })).toEqual({
    montoMensual: 45.5,
    diaVencimiento: 10,
  });
});

it("erroresDesdeApi ubica los mensajes conocidos bajo su campo", () => {
  expect(erroresDesdeApi([MSG.dia, "Otro error"])).toEqual({
    errores: { diaVencimiento: MSG.dia },
    resto: ["Otro error"],
  });
});

describe("periodos", () => {
  // 1 de diciembre 03:00 UTC = 30 de noviembre en El Salvador.
  const ahora = new Date("2026-12-01T03:00:00Z");

  it("usa el mes de El Salvador y ofrece el actual y el siguiente", () => {
    expect(periodoActual(ahora)).toBe("2026-11");
    expect(periodosGenerables(ahora)).toEqual(["2026-11", "2026-12"]);
  });

  it("sumarMeses cruza años", () => {
    expect(sumarMeses("2026-12", 1)).toBe("2027-01");
    expect(sumarMeses("2027-01", -1)).toBe("2026-12");
  });

  it("validarPeriodo rechaza formatos inválidos y meses posteriores al siguiente", () => {
    expect(validarPeriodo("2026-12", ahora)).toBeUndefined();
    expect(validarPeriodo("2026-05", ahora)).toBeUndefined();
    expect(validarPeriodo("2027-01", ahora)).toBe(MSG.periodoFuturo);
    expect(validarPeriodo("2026-13", ahora)).toBe(MSG.periodo);
  });
});

describe("mensajesResultado", () => {
  it("informa las creadas", () => {
    expect(mensajesResultado({ periodo: "2026-12", creadas: 28, omitidas: 0 })).toEqual([
      "Se crearon 28 cuotas para Diciembre 2026.",
    ]);
    expect(mensajesResultado({ periodo: "2026-12", creadas: 1, omitidas: 0 })).toEqual([
      "Se creó 1 cuota para Diciembre 2026.",
    ]);
  });

  it("agrega el aviso de omitidas del criterio de H02", () => {
    expect(mensajesResultado({ periodo: "2026-12", creadas: 0, omitidas: 30 })).toEqual([
      "No se crearon cuotas nuevas para Diciembre 2026.",
      "Se omitieron 30 unidades que ya tenían cuota",
    ]);
  });
});
