import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const actualizar = vi.fn();
const cambiarEstado = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/areas", () => ({
  crearArea: (...a: unknown[]) => crear(...a),
  actualizarArea: (...a: unknown[]) => actualizar(...a),
  cambiarEstadoArea: (...a: unknown[]) => cambiarEstado(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { actualizarEstadoArea, guardarArea } from "./areas";

function fd(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = {
    nombre: " Alberca ",
    capacidad: "30",
    horaApertura: "07:00",
    horaCierre: "19:00",
    duracionMaxHoras: "2",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}
const idle = { status: "idle" as const };
const datosLimpios = {
  nombre: "Alberca",
  capacidad: 30,
  horaApertura: "07:00",
  horaCierre: "19:00",
  duracionMaxHoras: 2,
};

beforeEach(() => {
  crear.mockReset();
  actualizar.mockReset();
  cambiarEstado.mockReset();
  revalidatePath.mockReset();
  redirect.mockClear();
});

describe("guardarArea", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await guardarArea(idle, fd({ capacidad: "0", horaCierre: "06:00" }));
    expect(r).toEqual({
      status: "error",
      errores: {
        capacidad: "La capacidad debe estar entre 1 y 200 personas",
        horaCierre: "La hora de cierre debe ser posterior a la de apertura",
      },
    });
    expect(crear).not.toHaveBeenCalled();
  });

  it("sin id crea con datos limpios, revalida y vuelve a la lista", async () => {
    crear.mockResolvedValue({ status: "ok", data: {} });
    await expect(guardarArea(idle, fd())).rejects.toThrow("NEXT_REDIRECT");
    expect(crear).toHaveBeenCalledWith(datosLimpios);
    expect(actualizar).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/areas");
    expect(redirect).toHaveBeenCalledWith("/admin/areas?ok=creada");
  });

  it("con id edita esa área", async () => {
    actualizar.mockResolvedValue({ status: "ok", data: {} });
    await expect(guardarArea(idle, fd({ id: "ar1" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(actualizar).toHaveBeenCalledWith("ar1", datosLimpios);
    expect(redirect).toHaveBeenCalledWith("/admin/areas?ok=editada");
  });

  it("409 pone 'Ya existe un área con ese nombre' bajo el nombre", async () => {
    crear.mockResolvedValue({ status: "conflict" });
    expect(await guardarArea(idle, fd())).toEqual({
      status: "error",
      errores: { nombre: "Ya existe un área con ese nombre" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("400: mensajes conocidos van al campo y el resto arriba", async () => {
    crear.mockResolvedValue({
      status: "bad_request",
      messages: ["La capacidad debe estar entre 1 y 200 personas", "otro error"],
    });
    expect(await guardarArea(idle, fd())).toEqual({
      status: "error",
      errores: { capacidad: "La capacidad debe estar entre 1 y 200 personas" },
      mensajes: ["otro error"],
    });
  });

  it("404, 403 y error del servidor", async () => {
    actualizar.mockResolvedValueOnce({ status: "not_found" });
    expect((await guardarArea(idle, fd({ id: "x" }))).mensajes).toEqual(["El área no existe"]);
    crear.mockResolvedValueOnce({ status: "forbidden" });
    expect((await guardarArea(idle, fd())).mensajes).toEqual([
      "No tienes permiso para esta acción",
    ]);
    crear.mockResolvedValueOnce({ status: "error" });
    expect((await guardarArea(idle, fd())).mensajes).toEqual([
      "No pudimos guardar el área. Intenta de nuevo.",
    ]);
  });
});

describe("actualizarEstadoArea", () => {
  it("ok revalida", async () => {
    cambiarEstado.mockResolvedValue({ status: "ok", data: {} });
    expect(await actualizarEstadoArea("ar1", false)).toEqual({ ok: true });
    expect(cambiarEstado).toHaveBeenCalledWith("ar1", false);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/areas");
  });

  it("404, 403 y error devuelven el mensaje", async () => {
    cambiarEstado.mockResolvedValueOnce({ status: "not_found" });
    expect(await actualizarEstadoArea("ar1", false)).toEqual({
      ok: false,
      error: "El área no existe",
    });
    cambiarEstado.mockResolvedValueOnce({ status: "forbidden" });
    expect(await actualizarEstadoArea("ar1", false)).toEqual({
      ok: false,
      error: "No tienes permiso para esta acción",
    });
    cambiarEstado.mockResolvedValueOnce({ status: "error" });
    expect((await actualizarEstadoArea("ar1", true)).ok).toBe(false);
  });
});
