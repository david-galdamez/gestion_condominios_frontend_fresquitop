import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const cancelar = vi.fn();
const editar = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/visitas", () => ({
  crearAutorizacion: (...a: unknown[]) => crear(...a),
  cancelarAutorizacion: (...a: unknown[]) => cancelar(...a),
  editarAutorizacion: (...a: unknown[]) => editar(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { cancelarVisita, crearVisita, editarVisita } from "./visitas";

function fd(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = {
    unidadId: "u1",
    nombre: " Ana Pérez ",
    tipoDocumento: "DUI",
    numeroDocumento: "12345678-9",
    placa: "",
    fechaVisita: "2026-11-10",
    horaEstimada: "10:00",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}
const idle = { status: "idle" as const };

beforeEach(() => {
  crear.mockReset();
  cancelar.mockReset();
  editar.mockReset();
  revalidatePath.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-04T18:00:00Z"));
});

describe("crearVisita", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await crearVisita(idle, fd({ fechaVisita: "2026-01-01", nombre: "a" }));
    expect(r.status).toBe("error");
    expect(r.errores).toMatchObject({
      fechaVisita: "Elige una fecha entre hoy y los próximos 30 días",
      nombre: "El nombre debe tener entre 3 y 60 caracteres",
    });
    expect(crear).not.toHaveBeenCalled();
  });

  it("envía datos limpios (sin placa vacía) y devuelve la autorización", async () => {
    const a = { id: "a1", codigo: "482915" };
    crear.mockResolvedValue({ status: "ok", data: a });
    const r = await crearVisita(idle, fd());
    expect(r).toEqual({ status: "ok", autorizacion: a });
    expect(crear).toHaveBeenCalledWith({
      unidadId: "u1",
      nombre: "Ana Pérez",
      tipoDocumento: "DUI",
      numeroDocumento: "12345678-9",
      fechaVisita: "2026-11-10",
      horaEstimada: "10:00",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/visitas");
  });

  it("pasaporte se envía en mayúsculas y con placa", async () => {
    crear.mockResolvedValue({ status: "ok", data: {} });
    await crearVisita(idle, fd({ tipoDocumento: "PASAPORTE", numeroDocumento: "ab12cd", placa: "P123" }));
    expect(crear.mock.calls[0][0]).toMatchObject({ numeroDocumento: "AB12CD", placa: "P123" });
  });

  it("mapea bad_request, forbidden y error", async () => {
    crear.mockResolvedValueOnce({ status: "bad_request", messages: ["No tienes unidades asignadas"] });
    expect(await crearVisita(idle, fd())).toEqual({
      status: "error",
      mensajes: ["No tienes unidades asignadas"],
    });
    crear.mockResolvedValueOnce({ status: "forbidden" });
    expect((await crearVisita(idle, fd())).mensajes).toEqual(["No tienes permiso para esta acción"]);
    crear.mockResolvedValueOnce({ status: "error" });
    expect((await crearVisita(idle, fd())).mensajes?.[0]).toMatch(/No pudimos/);
  });
});

describe("cancelarVisita", () => {
  it("ok revalida", async () => {
    cancelar.mockResolvedValue({ status: "ok", data: {} });
    expect(await cancelarVisita("a1")).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/visitas");
  });
  it("409 y 404 devuelven el mensaje exacto", async () => {
    cancelar.mockResolvedValueOnce({ status: "conflict" });
    expect(await cancelarVisita("a1")).toEqual({
      ok: false,
      error: "Esta autorización ya no se puede cancelar",
    });
    cancelar.mockResolvedValueOnce({ status: "not_found" });
    expect(await cancelarVisita("a1")).toEqual({ ok: false, error: "La autorización no existe" });
  });
  it("403", async () => {
    cancelar.mockResolvedValue({ status: "forbidden" });
    expect((await cancelarVisita("a1"))).toEqual({ ok: false, error: "No tienes permiso para esta acción" });
  });
});

describe("editarVisita (H07b)", () => {
  it("valida igual que al crear y no llama a la API", async () => {
    const r = await editarVisita("a1", "111111", idle, fd({ numeroDocumento: "123" }));
    expect(r.errores?.numeroDocumento).toBe(
      "El número de documento no tiene el formato correcto",
    );
    expect(editar).not.toHaveBeenCalled();
  });

  it("envía sin unidad, placa vacía como null, y marca código nuevo", async () => {
    editar.mockResolvedValue({ status: "ok", data: { id: "a1", codigo: "222222" } });
    const r = await editarVisita("a1", "111111", idle, fd());
    expect(editar).toHaveBeenCalledWith("a1", {
      nombre: "Ana Pérez",
      tipoDocumento: "DUI",
      numeroDocumento: "12345678-9",
      placa: null,
      fechaVisita: "2026-11-10",
      horaEstimada: "10:00",
    });
    expect(r).toMatchObject({ status: "ok", codigoNuevo: true });
    expect(revalidatePath).toHaveBeenCalledWith("/visitas");
  });

  it("mismo código -> codigoNuevo false", async () => {
    editar.mockResolvedValue({ status: "ok", data: { id: "a1", codigo: "111111" } });
    const r = await editarVisita("a1", "111111", idle, fd());
    expect(r.codigoNuevo).toBe(false);
  });

  it.each([
    ["conflict", "Esta autorización ya no se puede editar"],
    ["not_found", "La autorización no existe"],
    ["forbidden", "No tienes permiso para esta acción"],
    ["error", "No pudimos guardar los cambios. Intenta de nuevo."],
  ])("%s -> mensaje", async (status, msg) => {
    editar.mockResolvedValue({ status });
    const r = await editarVisita("a1", "111111", idle, fd());
    expect(r).toEqual({ status: "error", mensajes: [msg] });
  });
});
