import { describe, expect, it } from "vitest";
import {
  aDatosUsuario,
  erroresDesdeApi,
  MSG,
  validarPassword,
  validarUsuario,
} from "./usuario";

const ok = { nombre: " Ana ", email: " ANA@Mail.com ", password: "Str0ngPass", unidadIds: ["u1"] };

describe("validarUsuario", () => {
  it("acepta datos válidos", () => expect(validarUsuario(ok)).toEqual({}));
  it("marca campos inválidos", () => {
    expect(validarUsuario({ ...ok, nombre: " ", email: "x", password: "abc" })).toEqual({
      nombre: MSG.nombre,
      email: MSG.email,
      password: MSG.password,
    });
  });
  it("exige mayúscula, minúscula y número", () => {
    expect(validarPassword("alllowercase1")).toBe(MSG.password);
    expect(validarPassword("ALLUPPER123")).toBe(MSG.password);
    expect(validarPassword("NoNumbersHere")).toBe(MSG.password);
  });
});

describe("aDatosUsuario", () => {
  it("normaliza nombre y email", () =>
    expect(aDatosUsuario(ok)).toEqual({
      nombre: "Ana",
      email: "ana@mail.com",
      password: "Str0ngPass",
      unidadIds: ["u1"],
    }));
});

describe("erroresDesdeApi", () => {
  it("ubica mensajes bajo su campo y deja el resto", () => {
    const r = erroresDesdeApi(["La contraseña debe tener al menos 8 caracteres.", "Alguna de las unidades no existe o no está activa."]);
    expect(r.errores.password).toBe(MSG.password);
    expect(r.resto).toEqual(["Alguna de las unidades no existe o no está activa."]);
  });
});
