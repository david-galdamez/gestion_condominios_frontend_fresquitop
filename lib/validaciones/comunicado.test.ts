import { describe, expect, it } from "vitest";
import {
  aIsoSv,
  aLocalSv,
  erroresDesdeApi,
  MSG,
  validarComunicado,
  type CamposComunicado,
} from "./comunicado";

const base = (extra: Partial<CamposComunicado> = {}): CamposComunicado => ({
  titulo: "Corte de agua",
  contenido: "El sábado no habrá agua.",
  categoria: "AGUA",
  destino: "todos",
  torreIds: [],
  fechaPublicacion: "2026-11-20T08:00",
  fechaExpiracion: "",
  ...extra,
});

describe("validarComunicado", () => {
  it("acepta un comunicado válido", () => {
    expect(validarComunicado(base())).toEqual({});
  });

  it("marca título, contenido, categoría y destinatarios faltantes", () => {
    expect(
      validarComunicado(
        base({ titulo: "", contenido: "", categoria: "", destino: "torres" }),
      ),
    ).toEqual({
      titulo: MSG.titulo,
      contenido: MSG.contenido,
      categoria: MSG.categoria,
      destino: MSG.destino,
    });
  });

  it("límites de longitud", () => {
    expect(validarComunicado(base({ titulo: "abcd" })).titulo).toBe(MSG.titulo);
    expect(validarComunicado(base({ titulo: "abcde" })).titulo).toBeUndefined();
    expect(
      validarComunicado(base({ contenido: "a".repeat(2001) })).contenido,
    ).toBe(MSG.contenido);
  });

  it("expiración igual o anterior a la publicación", () => {
    for (const exp of ["2026-11-20T08:00", "2026-11-19T08:00"]) {
      expect(
        validarComunicado(base({ fechaExpiracion: exp })).fechaExpiracion,
      ).toBe(MSG.expiracion);
    }
    expect(
      validarComunicado(base({ fechaExpiracion: "2026-11-20T08:01" })),
    ).toEqual({});
  });

  it("torres concretas con al menos una", () => {
    expect(
      validarComunicado(base({ destino: "torres", torreIds: ["t1"] })),
    ).toEqual({});
  });
});

describe("conversión de hora de El Salvador (UTC-6)", () => {
  it("ida y vuelta", () => {
    expect(aIsoSv("2026-11-20T08:00")).toBe("2026-11-20T14:00:00.000Z");
    expect(aLocalSv(new Date("2026-11-20T14:00:00.000Z"))).toBe(
      "2026-11-20T08:00",
    );
  });
});

describe("erroresDesdeApi", () => {
  it("ubica los mensajes conocidos y deja el resto", () => {
    expect(erroresDesdeApi([MSG.expiracion, "otro"])).toEqual({
      errores: { fechaExpiracion: MSG.expiracion },
      resto: ["otro"],
    });
  });
});
