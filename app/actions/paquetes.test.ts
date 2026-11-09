import { beforeEach, describe, expect, it, vi } from "vitest";

const registrar = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/paquetes", () => ({
  registrarPaquete: (...a: unknown[]) => registrar(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { registrarPaqueteAction } from "./paquetes";

const png = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "etiqueta.png", { type: "image/png" });

function fd(over: Record<string, string> = {}, foto: File | null = png()) {
  const f = new FormData();
  const base = {
    unidadId: "u1",
    destinatario: " Carlos Pérez ",
    mensajeria: "DHL",
    guia: "",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  if (foto) f.set("foto", foto);
  return f;
}
const idle = { status: "idle" as const };

beforeEach(() => {
  registrar.mockReset();
  revalidatePath.mockReset();
  redirect.mockClear();
});

describe("registrarPaqueteAction", () => {
  it("valida en el servidor (incluida la foto) y no llama a la API", async () => {
    const pdf = new File(["%PDF"], "a.pdf", { type: "application/pdf" });
    const r = await registrarPaqueteAction(idle, fd({ destinatario: "a", mensajeria: "TNT" }, pdf));
    expect(r).toEqual({
      status: "error",
      errores: {
        destinatario: "El destinatario debe tener entre 3 y 60 caracteres",
        mensajeria: "Elige una mensajería de la lista",
        foto: "Solo JPG o PNG de hasta 5 MB",
      },
    });
    expect(registrar).not.toHaveBeenCalled();
  });

  it("envía campos limpios (sin guía vacía) y la foto; al registrar vuelve a la lista con el código", async () => {
    registrar.mockResolvedValue({ status: "ok", data: { codigoPaquete: "PAQ-000124", unidad: "A-101" } });
    await expect(registrarPaqueteAction(idle, fd())).rejects.toThrow("NEXT_REDIRECT");
    const enviado: FormData = registrar.mock.calls[0][0];
    expect(enviado.get("destinatario")).toBe("Carlos Pérez");
    expect(enviado.get("unidadId")).toBe("u1");
    expect(enviado.has("guia")).toBe(false);
    expect((enviado.get("foto") as File).name).toBe("etiqueta.png");
    expect(revalidatePath).toHaveBeenCalledWith("/porteria/paquetes");
    expect(redirect).toHaveBeenCalledWith("/porteria/paquetes?registrado=PAQ-000124&unidad=A-101");
  });

  it("con guía la manda", async () => {
    registrar.mockResolvedValue({ status: "ok", data: { codigoPaquete: "PAQ-000124", unidad: "A-101" } });
    await expect(registrarPaqueteAction(idle, fd({ guia: " G-1 " }))).rejects.toThrow();
    expect((registrar.mock.calls[0][0] as FormData).get("guia")).toBe("G-1");
  });

  it("409 y 404 van bajo la unidad", async () => {
    registrar.mockResolvedValueOnce({ status: "conflict" });
    expect(await registrarPaqueteAction(idle, fd())).toEqual({
      status: "error",
      errores: { unidadId: "La unidad no tiene residentes registrados" },
    });
    registrar.mockResolvedValueOnce({ status: "not_found" });
    expect((await registrarPaqueteAction(idle, fd())).errores).toEqual({ unidadId: "La unidad no existe" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("400 conocido va al campo; 403 y error van arriba", async () => {
    registrar.mockResolvedValueOnce({ status: "bad_request", messages: ["Solo JPG o PNG de hasta 5 MB", "otro"] });
    expect(await registrarPaqueteAction(idle, fd())).toEqual({
      status: "error",
      errores: { foto: "Solo JPG o PNG de hasta 5 MB" },
      mensajes: ["otro"],
    });
    registrar.mockResolvedValueOnce({ status: "forbidden" });
    expect((await registrarPaqueteAction(idle, fd())).mensajes).toEqual(["No tienes permiso para esta acción"]);
    registrar.mockResolvedValueOnce({ status: "error" });
    expect((await registrarPaqueteAction(idle, fd())).mensajes).toEqual([
      "No pudimos registrar el paquete. Intenta de nuevo.",
    ]);
  });
});
