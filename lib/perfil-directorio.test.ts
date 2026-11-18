import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("@/lib/api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { getMiPerfil, guardarMiPerfil } from "./perfil-directorio";

const resp = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const opciones = { visible: true, mostrarNombre: true, mostrarUnidad: false, mostrarTelefono: false, mostrarCorreo: false };
const perfil = {
  ...opciones,
  misDatos: { nombre: "Ana", unidad: "A-101", telefono: null, correo: "ana@test.com" },
  vistaPrevia: { nombre: "Ana", unidad: null, telefono: null, correo: null },
};

beforeEach(() => apiFetch.mockReset());

describe("lib/perfil-directorio", () => {
  it("getMiPerfil ok, forbidden, 500 y JSON inesperado", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, perfil));
    expect(await getMiPerfil()).toEqual({ status: "ok", data: perfil });
    expect(apiFetch).toHaveBeenCalledWith("directorio/mi-perfil", undefined);
    apiFetch.mockResolvedValueOnce(resp(403, {}));
    expect(await getMiPerfil()).toEqual({ status: "forbidden" });
    apiFetch.mockResolvedValueOnce(resp(500));
    expect(await getMiPerfil()).toEqual({ status: "error" });
    apiFetch.mockResolvedValueOnce(resp(200, { visible: "x" }));
    expect(await getMiPerfil()).toEqual({ status: "error" });
  });

  it("guardarMiPerfil envía PUT JSON con las 5 opciones; 400 trae el mensaje", async () => {
    apiFetch.mockResolvedValueOnce(resp(200, perfil));
    expect(await guardarMiPerfil(opciones)).toMatchObject({ status: "ok" });
    const [path, init] = apiFetch.mock.calls[0];
    expect(path).toBe("directorio/mi-perfil");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual(opciones);
    apiFetch.mockResolvedValueOnce(resp(400, { message: ["Elige al menos un dato para mostrar"] }));
    expect(await guardarMiPerfil(opciones)).toEqual({
      status: "bad_request",
      messages: ["Elige al menos un dato para mostrar"],
    });
  });

  it("falla de red -> error; redirect (digest) se propaga", async () => {
    apiFetch.mockRejectedValueOnce(new Error("red"));
    expect(await getMiPerfil()).toEqual({ status: "error" });
    const redir = Object.assign(new Error("NEXT_REDIRECT"), { digest: "x" });
    apiFetch.mockRejectedValueOnce(redir);
    await expect(getMiPerfil()).rejects.toBe(redir);
  });
});
