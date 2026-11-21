import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/usuarios", () => ({ crearUsuario: (...a: unknown[]) => crear(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { crearResidente } from "./usuarios";

function fd(over: Record<string, string> = {}, unidades = ["u1", "u2"]) {
  const f = new FormData();
  const base = { nombre: " Ana ", email: "Ana@Mail.com", password: "Str0ngPass", ...over };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  for (const u of unidades) f.append("unidadIds", u);
  return f;
}
const idle = { status: "idle" as const };

beforeEach(() => vi.clearAllMocks());

describe("crearResidente", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await crearResidente(idle, fd({ email: "x" }));
    expect(r.errores?.email).toBeDefined();
    expect(crear).not.toHaveBeenCalled();
  });

  it("envía datos normalizados con unidades y redirige", async () => {
    crear.mockResolvedValue({ status: "ok", data: { id: "1" } });
    await expect(crearResidente(idle, fd())).rejects.toThrow("NEXT_REDIRECT");
    expect(crear).toHaveBeenCalledWith({
      nombre: "Ana",
      email: "ana@mail.com",
      password: "Str0ngPass",
      unidadIds: ["u1", "u2"],
    });
    expect(redirect).toHaveBeenCalledWith("/admin/usuarios/nuevo?ok=creado");
  });

  it("409 marca el correo duplicado", async () => {
    crear.mockResolvedValue({ status: "conflict" });
    const r = await crearResidente(idle, fd());
    expect(r.errores?.email).toBe("El correo ya está registrado");
  });

  it("400 con mensaje desconocido va arriba del formulario", async () => {
    crear.mockResolvedValue({ status: "bad_request", messages: ["Alguna de las unidades no existe o no está activa."] });
    const r = await crearResidente(idle, fd());
    expect(r.mensajes).toEqual(["Alguna de las unidades no existe o no está activa."]);
  });

  it("403 y error genérico", async () => {
    crear.mockResolvedValueOnce({ status: "forbidden" });
    expect((await crearResidente(idle, fd())).mensajes).toEqual(["No tienes permiso para esta acción"]);
    crear.mockResolvedValueOnce({ status: "error" });
    expect((await crearResidente(idle, fd())).status).toBe("error");
  });
});
