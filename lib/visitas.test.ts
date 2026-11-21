import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import {
  cancelarAutorizacion,
  crearAutorizacion,
  getMisAutorizaciones,
  getUnidadesMias,
} from "./visitas";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const aut = { id: "a1", codigo: "482915", estado: "VIGENTE" };

beforeEach(() => apiFetch.mockReset());

describe("lib/visitas", () => {
  it("getUnidadesMias ok / error si no es arreglo", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, [{ id: "u1", codigo: "A-1" }]));
    expect(await getUnidadesMias()).toEqual({
      status: "ok",
      data: [{ id: "u1", codigo: "A-1" }],
    });
    expect(apiFetch).toHaveBeenCalledWith("unidades/mias", undefined);
    apiFetch.mockResolvedValueOnce(resp(200, { x: 1 }));
    expect(await getUnidadesMias()).toEqual({ status: "error" });
  });

  it("getMisAutorizaciones ok, forbidden, error 500 y JSON inválido", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { datos: [aut] }));
    expect(await getMisAutorizaciones()).toEqual({ status: "ok", data: [aut] });
    apiFetch.mockResolvedValueOnce(resp(403, { message: "x" }));
    expect(await getMisAutorizaciones()).toEqual({ status: "forbidden" });
    apiFetch.mockResolvedValueOnce(resp(500));
    expect(await getMisAutorizaciones()).toEqual({ status: "error" });
    apiFetch.mockResolvedValueOnce(resp(200, { datos: "no" }));
    expect(await getMisAutorizaciones()).toEqual({ status: "error" });
  });

  it("falla de red -> error; redirect (digest) se propaga", async () => {
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await getMisAutorizaciones()).toEqual({ status: "error" });
    const redir = Object.assign(new Error("NEXT_REDIRECT"), { digest: "x" });
    apiFetch.mockRejectedValueOnce(redir);
    await expect(getMisAutorizaciones()).rejects.toBe(redir);
  });

  it("crearAutorizacion envía POST JSON y mapea 201", async () => {
    apiFetch.mockResolvedValueOnce(resp(201, aut));
    const datos = {
      nombre: "Ana",
      tipoDocumento: "DUI" as const,
      numeroDocumento: "12345678-9",
      fechaVisita: "2026-11-10",
      horaEstimada: "10:00",
    };
    expect(await crearAutorizacion(datos)).toEqual({ status: "ok", data: aut });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("autorizaciones");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(datos);
  });

  it("crearAutorizacion 400 con string y con arreglo", async () => {
    apiFetch.mockResolvedValueOnce(resp(400, { message: "Selecciona una unidad" }));
    expect(await crearAutorizacion({} as never)).toEqual({
      status: "bad_request",
      messages: ["Selecciona una unidad"],
    });
    apiFetch.mockResolvedValueOnce(resp(400, { message: ["a", "b"] }));
    expect(await crearAutorizacion({} as never)).toEqual({
      status: "bad_request",
      messages: ["a", "b"],
    });
    apiFetch.mockResolvedValueOnce(resp(400, {}));
    expect(await crearAutorizacion({} as never)).toMatchObject({
      status: "bad_request",
    });
  });

  it("cancelarAutorizacion: ok, 404, 409, 403", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { ...aut, estado: "CANCELADA" }));
    expect(await cancelarAutorizacion("a1")).toMatchObject({ status: "ok" });
    expect(apiFetch).toHaveBeenCalledWith("autorizaciones/a1/cancelar", {
      method: "PATCH",
    });
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await cancelarAutorizacion("a1")).toEqual({ status: "not_found" });
    apiFetch.mockResolvedValueOnce(resp(409, {}));
    expect(await cancelarAutorizacion("a1")).toEqual({ status: "conflict" });
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await cancelarAutorizacion("a1")).toEqual({ status: "forbidden" });
  });
});
