import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { actualizarArea, cambiarEstadoArea, crearArea, getAreas } from "./areas";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const area = {
  id: "ar1",
  nombre: "Alberca",
  capacidad: 30,
  horaApertura: "07:00",
  horaCierre: "19:00",
  duracionMaxHoras: 2,
  activa: true,
};
const datos = {
  nombre: "Alberca",
  capacidad: 30,
  horaApertura: "07:00",
  horaCierre: "19:00",
  duracionMaxHoras: 2,
};

beforeEach(() => apiFetch.mockReset());

describe("lib/areas", () => {
  it("getAreas ok, forbidden, 500 y JSON inesperado", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { datos: [area] }));
    expect(await getAreas()).toEqual({ status: "ok", data: [area] });
    expect(apiFetch).toHaveBeenCalledWith("areas", undefined);
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await getAreas()).toEqual({ status: "forbidden" });
    apiFetch.mockResolvedValueOnce(resp(500));
    expect(await getAreas()).toEqual({ status: "error" });
    apiFetch.mockResolvedValueOnce(resp(200, { datos: "no" }));
    expect(await getAreas()).toEqual({ status: "error" });
  });

  it("falla de red -> error; redirect (digest) se propaga", async () => {
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await getAreas()).toEqual({ status: "error" });
    const redir = Object.assign(new Error("NEXT_REDIRECT"), { digest: "x" });
    apiFetch.mockRejectedValueOnce(redir);
    await expect(getAreas()).rejects.toBe(redir);
  });

  it("crearArea envía POST JSON; 409 -> conflict; 400 -> mensajes", async () => {
    apiFetch.mockResolvedValueOnce(resp(201, area));
    expect(await crearArea(datos)).toEqual({ status: "ok", data: area });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("areas");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(datos);

    apiFetch.mockResolvedValueOnce(resp(409, { message: "Ya existe un área con ese nombre" }));
    expect(await crearArea(datos)).toEqual({ status: "conflict" });
    apiFetch.mockResolvedValueOnce(resp(400, { message: ["a", "b"] }));
    expect(await crearArea(datos)).toEqual({ status: "bad_request", messages: ["a", "b"] });
  });

  it("actualizarArea usa PUT con el id; 404 -> not_found", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, area));
    expect(await actualizarArea("ar1", datos)).toMatchObject({ status: "ok" });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("areas/ar1");
    expect(init.method).toBe("PUT");
    apiFetch.mockResolvedValueOnce(resp(404, {}));
    expect(await actualizarArea("ar1", datos)).toEqual({ status: "not_found" });
  });

  it("cambiarEstadoArea usa PATCH /estado con { activa }", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, { ...area, activa: false }));
    expect(await cambiarEstadoArea("ar1", false)).toMatchObject({
      status: "ok",
      data: { activa: false },
    });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("areas/ar1/estado");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ activa: false });
  });
});
