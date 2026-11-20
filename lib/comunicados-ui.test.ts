import { describe, expect, it } from "vitest";
import {
  etiquetaCategoria,
  formatFechaHoraSv,
  hrefPestana,
  leerPestana,
} from "./comunicados-ui";

describe("comunicados-ui", () => {
  it("leerPestana: valores válidos e inválidos", () => {
    expect(leerPestana({})).toEqual({ archivo: false, pagina: 1 });
    expect(leerPestana({ archivo: "true", pagina: "3" })).toEqual({ archivo: true, pagina: 3 });
    expect(leerPestana({ archivo: "si", pagina: "0" })).toEqual({ archivo: false, pagina: 1 });
    expect(leerPestana({ pagina: "1.5" })).toEqual({ archivo: false, pagina: 1 });
    expect(leerPestana({ pagina: ["2", "3"] })).toEqual({ archivo: false, pagina: 1 });
  });

  it("hrefPestana omite los valores por defecto", () => {
    expect(hrefPestana({ archivo: false, pagina: 1 })).toBe("/comunicados");
    expect(hrefPestana({ archivo: true, pagina: 1 })).toBe("/comunicados?archivo=true");
    expect(hrefPestana({ archivo: false, pagina: 2 })).toBe("/comunicados?pagina=2");
  });

  it("etiqueta de categoría y fecha en hora de El Salvador", () => {
    expect(etiquetaCategoria("AVISO_GENERAL")).toBe("Aviso general");
    expect(etiquetaCategoria("OTRA")).toBe("OTRA");
    // 15:00 UTC = 09:00 en El Salvador.
    expect(formatFechaHoraSv("2026-11-20T15:00:00.000Z")).toMatch(/20\/11\/(20)?26.*9:00/);
    expect(formatFechaHoraSv("no-es-fecha")).toBe("no-es-fecha");
  });
});
