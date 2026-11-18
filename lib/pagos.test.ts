import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { getComprobante, getCuotasPorPagar, pagarCuotas } from "./pagos";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const tarjeta = { numero: "4242424242424242", vencimiento: "12/28", cvv: "123", titular: "Ana" };
const aprobado = { numeroTransaccion: "TX-20261117-000001", estado: "APROBADO", monto: 90, ultimos4: "4242", fecha: "x", cuotas: ["c1"] };

beforeEach(() => apiFetch.mockReset());

describe("lib/pagos", () => {
  it("getCuotasPorPagar con y sin unidad", async () => {
    const data = { unidad: { id: "u1", codigo: "A-101" }, unidades: [], cuotas: [] };
    apiFetch.mockResolvedValueOnce(resp(200, data));
    expect(await getCuotasPorPagar()).toEqual({ status: "ok", data });
    expect(apiFetch).toHaveBeenLastCalledWith("pagos/pendientes", undefined);
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await getCuotasPorPagar("u 2")).toEqual({ status: "forbidden" });
    expect(apiFetch).toHaveBeenLastCalledWith("pagos/pendientes?unidadId=u%202", undefined);
  });

  it("pagarCuotas manda la Idempotency-Key y el cuerpo; 201 -> ok", async () => {
    apiFetch.mockResolvedValueOnce(resp(201, aprobado));
    expect(await pagarCuotas(["c1"], tarjeta, "clave-1")).toEqual({ status: "ok", data: aprobado });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("pagos");
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe("clave-1");
    expect(JSON.parse(init.body)).toEqual({ cuotaIds: ["c1"], tarjeta });
  });

  it("422 -> rechazado con motivo; 409 -> conflict con mensaje; 404 y 400", async () => {
    apiFetch.mockResolvedValueOnce(resp(422, { estado: "RECHAZADO", motivo: "Fondos insuficientes" }));
    expect(await pagarCuotas(["c1"], tarjeta, "k")).toEqual({ status: "rechazado", motivo: "Fondos insuficientes" });
    apiFetch.mockResolvedValueOnce(resp(409, { message: "Esta cuota ya fue pagada" }));
    expect(await pagarCuotas(["c1"], tarjeta, "k")).toEqual({ status: "conflict", message: "Esta cuota ya fue pagada" });
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await pagarCuotas(["c1"], tarjeta, "k")).toEqual({ status: "not_found" });
    apiFetch.mockResolvedValueOnce(resp(400, { message: ["El CVV debe tener 3 dígitos"] }));
    expect(await pagarCuotas(["c1"], tarjeta, "k")).toEqual({ status: "bad_request", messages: ["El CVV debe tener 3 dígitos"] });
  });

  it("getComprobante ok y 404; falla de red -> error; redirect se propaga", async () => {
    const comp = { numeroTransaccion: "TX-1", fecha: "x", monto: 45, unidad: "A-101", ultimos4: "4242", titular: "Ana", cuotas: [] };
    apiFetch.mockResolvedValueOnce(resp(200, comp));
    expect(await getComprobante("TX-1")).toEqual({ status: "ok", data: comp });
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await getComprobante("TX-1")).toEqual({ status: "not_found" });
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await getComprobante("TX-1")).toEqual({ status: "error" });
    const redir = Object.assign(new Error("NEXT_REDIRECT"), { digest: "x" });
    apiFetch.mockRejectedValueOnce(redir);
    await expect(getComprobante("TX-1")).rejects.toBe(redir);
  });
});
