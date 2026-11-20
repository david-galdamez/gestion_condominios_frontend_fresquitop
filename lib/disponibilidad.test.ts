import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api";
import { getDisponibilidad } from "./disponibilidad";

const mockFetch = vi.mocked(apiFetch);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const datos = {
  fecha: "2026-11-21",
  areas: [
    {
      id: "a1",
      nombre: "Alberca",
      capacidad: 30,
      bloques: [{ inicio: "07:00", fin: "08:00", estado: "LIBRE" }],
    },
  ],
};

beforeEach(() => mockFetch.mockReset());

describe("getDisponibilidad", () => {
  it("hace GET /areas/disponibilidad con la fecha", async () => {
    mockFetch.mockResolvedValue(json(datos));
    await expect(getDisponibilidad("2026-11-21")).resolves.toEqual({ status: "ok", data: datos });
    expect(mockFetch).toHaveBeenCalledWith("areas/disponibilidad?fecha=2026-11-21");
  });

  it("400 -> bad_request con los mensajes del backend", async () => {
    mockFetch.mockResolvedValue(
      json({ message: ["Elige una fecha entre hoy y los próximos 30 días"] }, 400),
    );
    await expect(getDisponibilidad("2026-10-01")).resolves.toEqual({
      status: "bad_request",
      messages: ["Elige una fecha entre hoy y los próximos 30 días"],
    });
  });

  it("403 -> forbidden; 500, JSON inesperado o red caída -> error", async () => {
    mockFetch.mockResolvedValueOnce(json({}, 403));
    await expect(getDisponibilidad("2026-11-21")).resolves.toEqual({ status: "forbidden" });
    mockFetch.mockResolvedValueOnce(json({}, 500));
    await expect(getDisponibilidad("2026-11-21")).resolves.toEqual({ status: "error" });
    mockFetch.mockResolvedValueOnce(json({ datos: [] }));
    await expect(getDisponibilidad("2026-11-21")).resolves.toEqual({ status: "error" });
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(getDisponibilidad("2026-11-21")).resolves.toEqual({ status: "error" });
  });

  it("deja pasar el redirect de sesión vencida (error con digest)", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;..." });
    mockFetch.mockRejectedValueOnce(redirect);
    await expect(getDisponibilidad("2026-11-21")).rejects.toBe(redirect);
  });
});
