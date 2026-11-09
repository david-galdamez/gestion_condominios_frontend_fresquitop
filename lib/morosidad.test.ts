import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/api";
import { getMorosidad } from "./morosidad";

const mockFetch = vi.mocked(apiFetch);

const respuestaValida = {
  totalMora: 1350,
  unidadesMorosas: 9,
  datos: [
    {
      unidad: "B-204",
      cuotasVencidas: 3,
      montoAdeudado: 135,
      vencidaMasAntigua: "2026-08-10",
    },
  ],
  total: 9,
  pagina: 1,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getMorosidad", () => {
  it("sin filtros consulta admin/morosidad sin query string", async () => {
    mockFetch.mockResolvedValue(json(respuestaValida));
    await getMorosidad({});
    expect(mockFetch).toHaveBeenCalledWith("admin/morosidad");
  });

  it("arma la query con torreId y pagina cuando están presentes", async () => {
    mockFetch.mockResolvedValue(json(respuestaValida));
    await getMorosidad({
      torreId: "7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f",
      pagina: 2,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "admin/morosidad?torreId=7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f&pagina=2",
    );
  });

  it("200 válido -> status ok con los datos", async () => {
    mockFetch.mockResolvedValue(json(respuestaValida));
    expect(await getMorosidad({})).toEqual({
      status: "ok",
      data: respuestaValida,
    });
  });

  it("403 -> status forbidden", async () => {
    mockFetch.mockResolvedValue(json({}, 403));
    expect(await getMorosidad({})).toEqual({ status: "forbidden" });
  });

  it("404 -> status not_found con el mensaje del backend", async () => {
    mockFetch.mockResolvedValue(json({ message: "Torre no encontrada" }, 404));
    expect(await getMorosidad({ torreId: "uuid-inexistente" })).toEqual({
      status: "not_found",
      message: "Torre no encontrada",
    });
  });

  it("400 con arreglo de mensajes los une con punto", async () => {
    mockFetch.mockResolvedValue(
      json({ message: ["torreId debe ser un UUID válido", "pagina inválida"] }, 400),
    );
    expect(await getMorosidad({})).toEqual({
      status: "bad_request",
      message: "torreId debe ser un UUID válido. pagina inválida",
    });
  });

  it("500 o fallo de red -> status error", async () => {
    mockFetch.mockResolvedValue(json({}, 500));
    expect(await getMorosidad({})).toEqual({ status: "error" });

    mockFetch.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getMorosidad({})).toEqual({ status: "error" });
  });

  it("propaga el redirect de apiFetch (401)", async () => {
    const redirectErr = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/api/sesion/expirada",
    });
    mockFetch.mockRejectedValue(redirectErr);
    await expect(getMorosidad({})).rejects.toBe(redirectErr);
  });

  it("JSON malformado o con estructura inválida -> status error", async () => {
    mockFetch.mockResolvedValue(new Response("no-json", { status: 200 }));
    expect(await getMorosidad({})).toEqual({ status: "error" });

    mockFetch.mockResolvedValue(json({ totalMora: "1350" }, 200));
    expect(await getMorosidad({})).toEqual({ status: "error" });
  });
});