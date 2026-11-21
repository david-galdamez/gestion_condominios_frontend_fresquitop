import { describe, expect, it } from "vitest";
import { erroresDesdeApi, MSG, validarUnidad } from "./unidad";

describe("validarUnidad", () => {
  it("acepta datos válidos", () =>
    expect(validarUnidad({ torreId: "t1", codigo: "A-101" })).toEqual({}));
  it("marca torre y código vacíos o demasiado largos", () => {
    expect(validarUnidad({ torreId: "", codigo: " " })).toEqual({
      torreId: MSG.torre,
      codigo: MSG.codigo,
    });
    expect(validarUnidad({ torreId: "t", codigo: "x".repeat(21) }).codigo).toBe(MSG.codigo);
  });
});

describe("erroresDesdeApi", () => {
  it("ubica el mensaje de torre bajo su campo", () => {
    const r = erroresDesdeApi(["La torre no existe.", "otro"]);
    expect(r.errores.torreId).toBe("La torre no existe.");
    expect(r.resto).toEqual(["otro"]);
  });
});
