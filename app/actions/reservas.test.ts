import { beforeEach, describe, expect, it, vi } from "vitest";

const crear = vi.fn();
const cancelar = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/reservas", () => ({
  crearReserva: (...a: unknown[]) => crear(...a),
  cancelarReserva: (...a: unknown[]) => cancelar(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { cancelarReservaAction, crearReservaAction } from "./reservas";

function fd(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = {
    areaId: "a1",
    fecha: "2026-11-12",
    horaInicio: "10:00",
    horaFin: "12:00",
    asistentes: "12",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}
const idle = { status: "idle" as const };

beforeEach(() => {
  crear.mockReset();
  cancelar.mockReset();
  revalidatePath.mockReset();
  vi.useFakeTimers();
  // 04/11/2026 12:00 en El Salvador (UTC-6)
  vi.setSystemTime(new Date("2026-11-04T18:00:00Z"));
});

describe("crearReservaAction", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await crearReservaAction(idle, fd({ fecha: "2026-01-01", asistentes: "0" }));
    expect(r.status).toBe("error");
    expect(r.errores).toMatchObject({
      fecha: "No puedes reservar en una fecha pasada",
      asistentes: "Indica cuántas personas asistirán (1 o más)",
    });
    expect(crear).not.toHaveBeenCalled();
  });

  it("envía los datos con asistentes numérico y devuelve la reserva", async () => {
    const reserva = { id: "r1", codigo: "RES-000123" };
    crear.mockResolvedValue({ status: "ok", data: reserva });
    const r = await crearReservaAction(idle, fd());
    expect(crear).toHaveBeenCalledWith({
      areaId: "a1",
      fecha: "2026-11-12",
      horaInicio: "10:00",
      horaFin: "12:00",
      asistentes: 12,
    });
    expect(r).toEqual({ status: "ok", reserva });
    expect(revalidatePath).toHaveBeenCalledWith("/reservas");
  });

  it("409 muestra el mensaje del backend o el de por defecto", async () => {
    crear.mockResolvedValue({ status: "conflict", message: "Ese horario ya está reservado" });
    expect((await crearReservaAction(idle, fd())).mensajes).toEqual([
      "Ese horario ya está reservado",
    ]);
    crear.mockResolvedValue({ status: "conflict" });
    expect((await crearReservaAction(idle, fd())).mensajes).toEqual([
      "Ese horario ya está reservado",
    ]);
  });

  it("400 ubica los errores por campo y deja el resto arriba", async () => {
    crear.mockResolvedValue({
      status: "bad_request",
      messages: ["Supera la capacidad de 10 personas", "Otro"],
    });
    const r = await crearReservaAction(idle, fd());
    expect(r.errores).toEqual({ asistentes: "Supera la capacidad de 10 personas" });
    expect(r.mensajes).toEqual(["Otro"]);
  });

  it("404, 403 y error genérico", async () => {
    crear.mockResolvedValue({ status: "not_found" });
    expect((await crearReservaAction(idle, fd())).mensajes).toEqual([
      "El área no existe o está inactiva",
    ]);
    crear.mockResolvedValue({ status: "forbidden" });
    expect((await crearReservaAction(idle, fd())).mensajes).toEqual([
      "No tienes permiso para esta acción",
    ]);
    crear.mockResolvedValue({ status: "error" });
    expect((await crearReservaAction(idle, fd())).mensajes).toEqual([
      "No pudimos guardar la reserva. Intenta de nuevo.",
    ]);
  });
});

describe("cancelarReservaAction", () => {
  it("ok revalida la lista", async () => {
    cancelar.mockResolvedValue({ status: "ok", data: {} });
    expect(await cancelarReservaAction("r1")).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/reservas");
  });

  it("con menos de 24 horas muestra el motivo", async () => {
    cancelar.mockResolvedValue({ status: "conflict" });
    expect(await cancelarReservaAction("r1")).toEqual({
      ok: false,
      error: "Ya no puedes cancelar esta reserva",
    });
  });

  it("not_found, forbidden y error", async () => {
    cancelar.mockResolvedValue({ status: "not_found" });
    expect(await cancelarReservaAction("r1")).toEqual({ ok: false, error: "La reserva no existe" });
    cancelar.mockResolvedValue({ status: "forbidden" });
    expect((await cancelarReservaAction("r1")).ok).toBe(false);
    cancelar.mockResolvedValue({ status: "error" });
    expect(await cancelarReservaAction("r1")).toEqual({
      ok: false,
      error: "No pudimos cancelar la reserva. Intenta de nuevo.",
    });
  });
});
