import { describe, expect, it } from "vitest";
import { rutaDeReferencia } from "./notificaciones-ui";

describe("rutaDeReferencia", () => {
  it("traduce las referencias de paquetes a /mis-paquetes", () => {
    expect(rutaDeReferencia("/paquetes/abc")).toBe("/mis-paquetes/abc");
    expect(rutaDeReferencia("/paquetes")).toBe("/mis-paquetes");
  });
  it("deja intactas las rutas que ya existen", () => {
    for (const r of ["/comunicados/1", "/asambleas/2", "/reportes/R-5", "/estado-cuenta"])
      expect(rutaDeReferencia(r)).toBe(r);
  });
  it("devuelve null sin destino o con rutas externas", () => {
    expect(rutaDeReferencia(null)).toBeNull();
    expect(rutaDeReferencia("  ")).toBeNull();
    expect(rutaDeReferencia("https://x.com")).toBeNull();
    expect(rutaDeReferencia("//x.com")).toBeNull();
  });
});
