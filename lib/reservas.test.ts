import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api";
import {
  cancelarReserva,
  crearReserva,
  getAreasReservables,
  getMisReservas,
} from "./reservas";

const mockFetch = vi.mocked(apiFetch);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const reserva = {
  id: "r1",
  codigo: "RES-000123",
  area: "Alberca",
  fecha: "2026-11-10",
  horaInicio: "09:00",
  horaFin: "11:00",
  asistentes: 12,
  estado: "CONFIRMADA",
};
const datos = {
  areaId: "a1",
  fecha: "2026-11-10",
  horaInicio: "09:00",
  horaFin: "11:00",
  asistentes: 12,
};

beforeEach(() => mockFetch.mockReset());

describe("crearReserva", () => {
  it("hace POST /reservas con el cuerpo en JSON", async () => {
    mockFetch.mockResolvedValue(json(reserva, 201));
    const r = await crearReserva(datos);
    expect(r).toEqual({ status: "ok", data: reserva });
    const [path, init] = mockFetch.mock.calls[0];
    expect(path).toBe("reservas");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(datos);
  });

  it("409 conserva el mensaje del backend", async () => {
    mockFetch.mockResolvedValue(json({ message: "Ese horario ya está reservado" }, 409));
    expect(await crearReserva(datos)).toEqual({
      status: "conflict",
      message: "Ese horario ya está reservado",
    });
  });

  it("409 sin mensaje", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 409 }));
    expect(await crearReserva(datos)).toEqual({ status: "conflict" });
  });

  it("400 con message string[] y string", async () => {
    mockFetch.mockResolvedValue(json({ message: ["a", "b"] }, 400));
    expect(await crearReserva(datos)).toEqual({ status: "bad_request", messages: ["a", "b"] });
    mockFetch.mockResolvedValue(json({ message: "Fuera del horario del área" }, 400));
    expect(await crearReserva(datos)).toEqual({
      status: "bad_request",
      messages: ["Fuera del horario del área"],
    });
  });

  it("403, 404, 500 y red", async () => {
    mockFetch.mockResolvedValue(json({}, 403));
    expect(await crearReserva(datos)).toEqual({ status: "forbidden" });
    mockFetch.mockResolvedValue(json({}, 404));
    expect(await crearReserva(datos)).toEqual({ status: "not_found" });
    mockFetch.mockResolvedValue(json({}, 500));
    expect(await crearReserva(datos)).toEqual({ status: "error" });
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await crearReserva(datos)).toEqual({ status: "error" });
  });

  it("201 con forma inesperada -> error", async () => {
    mockFetch.mockResolvedValue(json({ foo: 1 }, 201));
    expect(await crearReserva(datos)).toEqual({ status: "error" });
  });

  it("propaga el redirect de apiFetch", async () => {
    const redirectErr = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;x" });
    mockFetch.mockRejectedValueOnce(redirectErr);
    await expect(crearReserva(datos)).rejects.toBe(redirectErr);
  });
});

describe("getMisReservas", () => {
  it("lee { datos }", async () => {
    mockFetch.mockResolvedValue(json({ datos: [reserva] }));
    expect(await getMisReservas()).toEqual({ status: "ok", data: [reserva] });
    expect(mockFetch).toHaveBeenCalledWith("reservas/mias", undefined);
  });

  it("forma inesperada -> error", async () => {
    mockFetch.mockResolvedValue(json({ datos: "x" }));
    expect(await getMisReservas()).toEqual({ status: "error" });
  });
});

describe("cancelarReserva", () => {
  it("PATCH /reservas/{id}/cancelar", async () => {
    mockFetch.mockResolvedValue(json({ ...reserva, estado: "CANCELADA" }));
    const r = await cancelarReserva("r 1");
    expect(r.status).toBe("ok");
    const [path, init] = mockFetch.mock.calls[0];
    expect(path).toBe("reservas/r%201/cancelar");
    expect(init?.method).toBe("PATCH");
  });

  it("409 trae el motivo", async () => {
    mockFetch.mockResolvedValue(json({ message: "Ya no puedes cancelar esta reserva" }, 409));
    expect(await cancelarReserva("r1")).toEqual({
      status: "conflict",
      message: "Ya no puedes cancelar esta reserva",
    });
  });
});

describe("getAreasReservables", () => {
  it("deja solo las áreas activas", async () => {
    const a = { id: "1", nombre: "A", capacidad: 5, horaApertura: "08:00", horaCierre: "10:00", duracionMaxHoras: 2 };
    mockFetch.mockResolvedValue(json({ datos: [{ ...a, activa: true }, { ...a, id: "2", activa: false }] }));
    const r = await getAreasReservables();
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.map((x) => x.id)).toEqual(["1"]);
  });

  it("propaga el estado de error", async () => {
    mockFetch.mockResolvedValue(json({}, 403));
    expect(await getAreasReservables()).toEqual({ status: "forbidden" });
  });
});
