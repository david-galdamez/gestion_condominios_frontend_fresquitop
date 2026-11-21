import { describe, expect, it } from "vitest";
import {
  COMENTARIO_CIERRE_MAX,
  COMENTARIO_CIERRE_MIN,
  MSG_RESOLUCION,
  validarComentarioCierre,
} from "./reporte-resolucion";

describe("validarComentarioCierre (H24)", () => {
  it("acepta comentarios en los límites exactos (10 y 300 caracteres)", () => {
    expect(validarComentarioCierre("x".repeat(COMENTARIO_CIERRE_MIN))).toBeNull();
    expect(validarComentarioCierre("x".repeat(COMENTARIO_CIERRE_MAX))).toBeNull();
  });

  it.each([
    ["vacío", ""],
    ["solo espacios", "            "],
    ["menor a 10 caracteres", "123456789"],
    ["mayor a 300 caracteres", "x".repeat(301)],
  ])("rechaza un comentario %s", (_caso, comentario) => {
    expect(validarComentarioCierre(comentario)).toBe(
      MSG_RESOLUCION.comentarioLongitud,
    );
  });
});