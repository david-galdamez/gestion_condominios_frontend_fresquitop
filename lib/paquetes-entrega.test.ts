import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { entregarPaquete } from "./paquetes";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const entrega = {
  id: "p1",
  codigoPaquete: "PAQ-000123",
  estado: "ENTREGADO",
  entregadoEn: "2026-11-10T16:00:00.000Z",
  entregadoA: "Carlos Pérez",
};
const datos = { codigoRetiro: "482915", recibidoPor: "Carlos Pérez" };

beforeEach(() => apiFetch.mockReset());

describe("entregarPaquete", () => {
  it("POST /paquetes/{id}/entrega con JSON y mapea 200", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, entrega));
    expect(await entregarPaquete("p 1", datos)).toEqual({ status: "ok", data: entrega });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("paquetes/p%201/entrega");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(datos);
  });

  it("400 con el código incorrecto", async () => {
    apiFetch.mockResolvedValueOnce(resp(400, { message: "Código de retiro incorrecto" }));
    expect(await entregarPaquete("p1", datos)).toEqual({
      status: "bad_request",
      messages: ["Código de retiro incorrecto"],
    });
  });

  it("409, 404, 403 y 500", async () => {
    apiFetch.mockResolvedValueOnce(resp(409, { message: "x" }));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "conflict" });
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "not_found" });
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "forbidden" });
    apiFetch.mockResolvedValueOnce(resp(500));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "error" });
  });

  it("200 que no es una entrega -> error; falla de red -> error", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { id: "p1", estado: "EN_PORTERIA" }));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "error" });
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await entregarPaquete("p1", datos)).toEqual({ status: "error" });
  });
});
