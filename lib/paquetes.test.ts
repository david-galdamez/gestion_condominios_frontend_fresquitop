import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { getPaquetesPorteria, getUnidades, registrarPaquete } from "./paquetes";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const paquete = {
  id: "p1",
  codigoPaquete: "PAQ-000123",
  unidad: "A-101",
  destinatario: "Ana",
  mensajeria: "DHL",
  guia: null,
  estado: "EN_PORTERIA",
  recibidoEn: "2026-11-04T18:40:00.000Z",
};

beforeEach(() => apiFetch.mockReset());

describe("lib/paquetes", () => {
  it("getUnidades ok y error si no es arreglo", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, [{ id: "u1", codigo: "A-101" }]));
    expect(await getUnidades()).toEqual({ status: "ok", data: [{ id: "u1", codigo: "A-101" }] });
    expect(apiFetch).toHaveBeenCalledWith("unidades", undefined);
    apiFetch.mockResolvedValueOnce(resp(200, { x: 1 }));
    expect(await getUnidades()).toEqual({ status: "error" });
  });

  it("getPaquetesPorteria ok, forbidden y 500", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { datos: [paquete] }));
    expect(await getPaquetesPorteria()).toEqual({ status: "ok", data: [paquete] });
    expect(apiFetch).toHaveBeenCalledWith("paquetes", undefined);
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await getPaquetesPorteria()).toEqual({ status: "forbidden" });
    apiFetch.mockResolvedValueOnce(resp(500));
    expect(await getPaquetesPorteria()).toEqual({ status: "error" });
  });

  it("registrarPaquete manda el FormData sin Content-Type y mapea 201, 409, 404 y 400", async () => {
    const fd = new FormData();
    fd.set("destinatario", "Ana");
    apiFetch.mockResolvedValueOnce(resp(201, paquete));
    expect(await registrarPaquete(fd)).toEqual({ status: "ok", data: paquete });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("paquetes");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(fd);
    expect(init.headers).toBeUndefined();

    apiFetch.mockResolvedValueOnce(resp(409, { message: "x" }));
    expect(await registrarPaquete(fd)).toEqual({ status: "conflict" });
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await registrarPaquete(fd)).toEqual({ status: "not_found" });
    apiFetch.mockResolvedValueOnce(resp(400, { message: "Solo JPG o PNG de hasta 5 MB" }));
    expect(await registrarPaquete(fd)).toEqual({
      status: "bad_request",
      messages: ["Solo JPG o PNG de hasta 5 MB"],
    });
  });

  it("falla de red -> error; redirect (digest) se propaga", async () => {
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await getPaquetesPorteria()).toEqual({ status: "error" });
    const redir = Object.assign(new Error("NEXT_REDIRECT"), { digest: "x" });
    apiFetch.mockRejectedValueOnce(redir);
    await expect(getPaquetesPorteria()).rejects.toBe(redir);
  });
});
