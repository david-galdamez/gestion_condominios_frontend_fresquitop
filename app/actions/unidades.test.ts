import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/usuarios", () => ({ crearUnidad: (...a: unknown[]) => crear(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { crearNuevaUnidad } from "./unidades";

const fd = (torreId = "t1", codigo = " A-101 ") => {
  const f = new FormData();
  f.set("torreId", torreId);
  f.set("codigo", codigo);
  return f;
};
const idle = { status: "idle" as const };

beforeEach(() => vi.clearAllMocks());

describe("crearNuevaUnidad", () => {
  it("valida en el servidor", async () => {
    const r = await crearNuevaUnidad(idle, fd("", ""));
    expect(r.errores?.torreId).toBeDefined();
    expect(crear).not.toHaveBeenCalled();
  });
  it("envía el código recortado y redirige", async () => {
    crear.mockResolvedValue({ status: "ok", data: { id: "1", codigo: "A-101" } });
    await expect(crearNuevaUnidad(idle, fd())).rejects.toThrow("NEXT_REDIRECT");
    expect(crear).toHaveBeenCalledWith({ torreId: "t1", codigo: "A-101" });
    expect(redirect).toHaveBeenCalledWith("/admin/unidades/nueva?ok=creada");
  });
  it("409 marca el código duplicado", async () => {
    crear.mockResolvedValue({ status: "conflict" });
    expect((await crearNuevaUnidad(idle, fd())).errores?.codigo).toBe(
      "Ya existe una unidad con ese código",
    );
  });
  it("403 muestra aviso de permiso", async () => {
    crear.mockResolvedValue({ status: "forbidden" });
    expect((await crearNuevaUnidad(idle, fd())).mensajes).toEqual([
      "No tienes permiso para esta acción",
    ]);
  });
});
