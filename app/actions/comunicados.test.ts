import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
vi.mock("@/lib/comunicados", () => ({
  crearComunicado: (...a: unknown[]) => crear(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { publicarComunicado } from "./comunicados";

const idle = { status: "idle" as const };

function fd(over: Record<string, string | string[]> = {}) {
  const f = new FormData();
  const base: Record<string, string | string[]> = {
    titulo: " Corte de agua ",
    contenido: "El sábado no habrá agua.",
    categoria: "AGUA",
    destino: "todos",
    fechaPublicacion: "2026-11-17T12:00",
    fechaExpiracion: "",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) {
    for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  }
  return f;
}

beforeEach(() => {
  crear.mockReset();
  revalidatePath.mockReset();
  vi.useFakeTimers();
  // 12:00 en El Salvador.
  vi.setSystemTime(new Date("2026-11-17T18:00:00Z"));
});

describe("publicarComunicado", () => {
  it("valida y no llama a la API", async () => {
    const r = await publicarComunicado(idle, fd({ titulo: "x", destino: "torres" }));
    expect(r.errores).toMatchObject({
      titulo: "El título debe tener entre 5 y 100 caracteres",
      destino: "Selecciona los destinatarios",
    });
    expect(crear).not.toHaveBeenCalled();
  });

  it("publicación ahora: no envía fecha y redirige con ok=publicado", async () => {
    crear.mockResolvedValue({ status: "ok", data: { id: "c1", estado: "PUBLICADO" } });
    await expect(publicarComunicado(idle, fd())).rejects.toThrow(
      "REDIRECT /admin/comunicados?ok=publicado",
    );
    expect(crear).toHaveBeenCalledWith({
      titulo: "Corte de agua",
      contenido: "El sábado no habrá agua.",
      categoria: "AGUA",
      destino: { todos: true },
    });
  });

  it("futura y por torres: convierte a ISO UTC y queda programado", async () => {
    crear.mockResolvedValue({ status: "ok", data: { id: "c1", estado: "PROGRAMADO" } });
    await expect(
      publicarComunicado(
        idle,
        fd({
          destino: "torres",
          torreIds: ["t1", "t2"],
          fechaPublicacion: "2026-11-20T08:00",
          fechaExpiracion: "2026-11-21T08:00",
        }),
      ),
    ).rejects.toThrow("ok=programado");
    expect(crear.mock.calls[0][0]).toMatchObject({
      destino: { todos: false, torreIds: ["t1", "t2"] },
      fechaPublicacion: "2026-11-20T14:00:00.000Z",
      fechaExpiracion: "2026-11-21T14:00:00.000Z",
    });
  });

  it("400 de la API se ubica en su campo; error genérico arriba", async () => {
    crear.mockResolvedValue({
      status: "bad_request",
      messages: ["La expiración debe ser posterior a la publicación"],
    });
    const r = await publicarComunicado(idle, fd());
    expect(r.errores?.fechaExpiracion).toBe(
      "La expiración debe ser posterior a la publicación",
    );
    crear.mockResolvedValue({ status: "error" });
    expect((await publicarComunicado(idle, fd())).mensajes).toEqual([
      "No pudimos guardar el comunicado. Intenta de nuevo.",
    ]);
  });
});
