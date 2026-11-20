import { describe, expect, it } from "vitest";
import { diasEntre, queryDePeriodo, resolverPeriodo, validarRango } from "./panel-periodo";

const HOY = "2026-11-20";

describe("resolverPeriodo", () => {
  it("sin parámetros usa el mes actual: del día 1 a hoy", () => {
    expect(resolverPeriodo({}, HOY)).toEqual({
      periodo: "mes",
      desde: "2026-11-01",
      hasta: HOY,
    });
  });

  it("un periodo desconocido cae al mes actual", () => {
    expect(resolverPeriodo({ periodo: "xyz" }, HOY).periodo).toBe("mes");
  });

  it("3m son los últimos 90 días y 12m los últimos 365, ambos hasta hoy", () => {
    const tres = resolverPeriodo({ periodo: "3m" }, HOY);
    expect(tres).toEqual({ periodo: "3m", desde: "2026-08-23", hasta: HOY });
    expect(diasEntre(tres.desde, tres.hasta)).toBe(90);

    const doce = resolverPeriodo({ periodo: "12m" }, HOY);
    expect(doce).toEqual({ periodo: "12m", desde: "2025-11-21", hasta: HOY });
    expect(diasEntre(doce.desde, doce.hasta)).toBe(365);
  });

  it("rango toma desde y hasta de la URL", () => {
    expect(
      resolverPeriodo({ periodo: "rango", desde: "2026-09-01", hasta: "2026-09-30" }, HOY),
    ).toEqual({ periodo: "rango", desde: "2026-09-01", hasta: "2026-09-30" });
  });

  it("rango incompleto, invertido o mayor a 366 días trae un error", () => {
    expect(resolverPeriodo({ periodo: "rango" }, HOY).error).toBeTruthy();
    expect(
      resolverPeriodo({ periodo: "rango", desde: "2026-09-30", hasta: "2026-09-01" }, HOY).error,
    ).toMatch(/posterior/);
    expect(
      resolverPeriodo({ periodo: "rango", desde: "2025-01-01", hasta: "2026-11-20" }, HOY).error,
    ).toMatch(/366/);
  });
});

describe("validarRango", () => {
  it("acepta el máximo de 366 días y rechaza 367", () => {
    expect(validarRango("2025-11-20", "2026-11-20")).toBeNull();
    expect(validarRango("2025-11-19", "2026-11-20")).toMatch(/366/);
  });

  it("rechaza fechas que no existen", () => {
    expect(validarRango("2026-02-31", "2026-03-05")).toMatch(/válidas/);
  });
});

describe("queryDePeriodo", () => {
  it("arma desde y hasta para el backend", () => {
    expect(queryDePeriodo({ desde: "2026-11-01", hasta: "2026-11-30" })).toBe(
      "desde=2026-11-01&hasta=2026-11-30",
    );
  });
});
