import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api";
import { getPanel } from "./panel";

const mockFetch = vi.mocked(apiFetch);
const periodo = { desde: "2026-11-01", hasta: "2026-11-30" };

const respuestaValida = {
  mora: { monto: 1350, unidadesMorosas: 9, porcentajeMorosas: 30 },
  ocupacion: [{ area: "Alberca", porcentaje: 42.5, cambio: 5.2 }],
  areaMasUsada: "Alberca",
  incidencias: { ALTA: 2, MEDIA: 4, BAJA: 1, SIN_ASIGNAR: 3, cambio: -10 },
  participacion: [{ asamblea: "Asamblea de noviembre", porcentaje: 70 }],
  generadoEn: "2026-11-20T18:00:00.000Z",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getPanel", () => {
  it("consulta admin/panel con desde y hasta", async () => {
    mockFetch.mockResolvedValue(json(respuestaValida));
    await getPanel(periodo);
    expect(mockFetch).toHaveBeenCalledWith(
      "admin/panel?desde=2026-11-01&hasta=2026-11-30",
    );
  });

  it("200 válido -> ok con los datos", async () => {
    mockFetch.mockResolvedValue(json(respuestaValida));
    expect(await getPanel(periodo)).toEqual({ status: "ok", data: respuestaValida });
  });

  it("403 -> forbidden", async () => {
    mockFetch.mockResolvedValue(json({}, 403));
    expect(await getPanel(periodo)).toEqual({ status: "forbidden" });
  });

  it("400 -> bad_request con el mensaje del backend (texto o lista)", async () => {
    mockFetch.mockResolvedValue(json({ message: "desde no puede ser posterior a hasta" }, 400));
    expect(await getPanel(periodo)).toEqual({
      status: "bad_request",
      message: "desde no puede ser posterior a hasta",
    });
    mockFetch.mockResolvedValue(json({ message: ["a", "b"] }, 400));
    expect(await getPanel(periodo)).toEqual({ status: "bad_request", message: "a. b" });
  });

  it("500 o cuerpo inválido -> error", async () => {
    mockFetch.mockResolvedValue(json({}, 500));
    expect(await getPanel(periodo)).toEqual({ status: "error" });
    mockFetch.mockResolvedValue(json({ algo: 1 }));
    expect(await getPanel(periodo)).toEqual({ status: "error" });
  });

  it("fallo de red -> error", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getPanel(periodo)).toEqual({ status: "error" });
  });

  it("propaga el redirect de apiFetch (401)", async () => {
    const redirectErr = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/api/sesion/expirada",
    });
    mockFetch.mockRejectedValue(redirectErr);
    await expect(getPanel(periodo)).rejects.toBe(redirectErr);
  });
});
