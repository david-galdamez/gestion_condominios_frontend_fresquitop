import { describe, expect, it } from "vitest";
import { leerFiltros } from "./leer-filtros";

describe("leerFiltros (morosidad)", () => {
  it("sin parámetros devuelve todo undefined", () => {
    expect(leerFiltros({})).toEqual({
      torreId: undefined,
      pagina: undefined,
    });
  });

  it("acepta torreId y pagina válidos", () => {
    expect(
      leerFiltros({
        torreId: "7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f",
        pagina: "2",
      }),
    ).toEqual({
      torreId: "7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f",
      pagina: 2,
    });
  });

  it("toma el primer elemento cuando llegan arreglos", () => {
    expect(
      leerFiltros({
        torreId: ["Torre A", "Torre B"],
        pagina: ["3", "5"],
      }),
    ).toEqual({
      torreId: "Torre A",
      pagina: 3,
    });
  });

  it("ignora torreId vacío o con solo espacios", () => {
    expect(leerFiltros({ torreId: "   " }).torreId).toBeUndefined();
  });

  it.each(["0", "-1", "1.5", "abc", "", "NaN"])(
    "ignora pagina inválida %j",
    (p) => {
      expect(leerFiltros({ pagina: p }).pagina).toBeUndefined();
    },
  );
});