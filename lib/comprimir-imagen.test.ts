import { afterEach, describe, expect, it, vi } from "vitest";
import { comprimirImagen, OBJETIVO_BYTES } from "./comprimir-imagen";

const archivo = (bytes: number, type = "image/png", name = "foto.png") =>
  new File([new Uint8Array(bytes)], name, { type });

afterEach(() => vi.unstubAllGlobals());

describe("comprimirImagen", () => {
  it("no toca archivos ya pequeños ni tipos distintos", async () => {
    const chico = archivo(1000);
    expect(await comprimirImagen(chico)).toBe(chico);
    const pdf = archivo(OBJETIVO_BYTES * 3, "application/pdf", "a.pdf");
    expect(await comprimirImagen(pdf)).toBe(pdf);
  });

  it("devuelve el original si el navegador no soporta createImageBitmap", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const grande = archivo(OBJETIVO_BYTES * 4);
    expect(await comprimirImagen(grande)).toBe(grande);
  });

  it("devuelve el original si la decodificación falla", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("x")));
    const grande = archivo(OBJETIVO_BYTES * 4);
    expect(await comprimirImagen(grande)).toBe(grande);
  });

  it("reduce a JPEG más liviano y reescala a 1600 px como máximo", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }));
    const ctx = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: "" };
    const canvases: HTMLCanvasElement[] = [];
    const crear = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag !== "canvas") return crear(tag);
      const c = {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array(200 * 1024)])),
      } as unknown as HTMLCanvasElement;
      canvases.push(c);
      return c;
    });

    const salida = await comprimirImagen(archivo(OBJETIVO_BYTES * 8, "image/png", "IMG_1.png"));
    expect(salida.type).toBe("image/jpeg");
    expect(salida.name).toBe("IMG_1.jpg");
    expect(salida.size).toBeLessThanOrEqual(OBJETIVO_BYTES);
    expect(canvases[0].width).toBe(1600);
    expect(canvases[0].height).toBe(1200);
  });
});
