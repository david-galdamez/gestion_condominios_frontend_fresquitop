import { describe, expect, it, vi } from "vitest";
import {
  MSG_ERROR_EXPORTAR,
  MSG_SIN_PERMISO,
  nombreDesdeDisposition,
  pedirReporte,
  urlExportar,
} from "./exportar-reporte";

const P = { formato: "PDF" as const, version: "RESUMIDA" as const, desde: "2026-11-01", hasta: "2026-11-20" };

const respuesta = (body: BodyInit | null, init: ResponseInit & { headers?: Record<string, string> }) =>
  vi.fn().mockResolvedValue(new Response(body, init));

describe("exportar-reporte", () => {
  it("urlExportar arma la ruta del handler con el periodo y las opciones", () => {
    expect(urlExportar(P)).toBe(
      "/api/reportes-condominio/exportar?formato=PDF&version=RESUMIDA&desde=2026-11-01&hasta=2026-11-20",
    );
  });

  it("nombreDesdeDisposition toma el nombre del backend o uno por defecto", () => {
    expect(nombreDesdeDisposition('attachment; filename="reporte-condominio-2026-11-20.pdf"', "PDF")).toBe(
      "reporte-condominio-2026-11-20.pdf",
    );
    expect(nombreDesdeDisposition(null, "EXCEL")).toBe("reporte-condominio.xlsx");
  });

  it("200 con el archivo -> ok con el blob y el nombre", async () => {
    const fetcher = respuesta("%PDF-1.3", {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="reporte-condominio-2026-11-20.pdf"',
      },
    });
    const r = await pedirReporte(P, fetcher);
    expect(fetcher).toHaveBeenCalledWith(urlExportar(P));
    expect(r).toMatchObject({ ok: true, nombre: "reporte-condominio-2026-11-20.pdf" });
    if (r.ok) expect(await r.archivo.text()).toBe("%PDF-1.3");
  });

  it("400 -> primer mensaje del backend", async () => {
    const fetcher = respuesta(JSON.stringify({ message: ["Selecciona un periodo"] }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
    expect(await pedirReporte(P, fetcher)).toEqual({ ok: false, mensaje: "Selecciona un periodo" });
  });

  it("403 -> sin permiso", async () => {
    const fetcher = respuesta(JSON.stringify({ message: null }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
    expect(await pedirReporte(P, fetcher)).toEqual({ ok: false, mensaje: MSG_SIN_PERMISO });
  });

  it.each([
    ["500", respuesta(JSON.stringify({ message: null }), { status: 500, headers: { "content-type": "application/json" } })],
    ["HTML (sesión expirada)", respuesta("<html></html>", { status: 200, headers: { "content-type": "text/html" } })],
    ["error de red", vi.fn().mockRejectedValue(new TypeError("fetch failed"))],
  ])("%s -> mensaje genérico", async (_t, fetcher) => {
    expect(await pedirReporte(P, fetcher)).toEqual({ ok: false, mensaje: MSG_ERROR_EXPORTAR });
  });
});
