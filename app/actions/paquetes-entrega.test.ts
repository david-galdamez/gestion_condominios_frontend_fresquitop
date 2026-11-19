import { beforeEach, describe, expect, it, vi } from "vitest";

const entregar = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/paquetes", () => ({
  registrarPaquete: vi.fn(),
  entregarPaquete: (...a: unknown[]) => entregar(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { entregarPaqueteAction } from "./paquetes";

function fd(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = { codigoRetiro: "482915", recibidoPor: " Carlos Pérez ", ...over };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}
const idle = { status: "idle" as const };

beforeEach(() => {
  entregar.mockReset();
  revalidatePath.mockReset();
  redirect.mockClear();
});

describe("entregarPaqueteAction", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await entregarPaqueteAction("p1", idle, fd({ codigoRetiro: "12", recibidoPor: "a" }));
    expect(r.status).toBe("error");
    expect(r.errores).toEqual({
      codigoRetiro: "El código de retiro debe tener 6 dígitos",
      recibidoPor: "Quien recibe debe tener entre 3 y 60 caracteres",
    });
    expect(entregar).not.toHaveBeenCalled();
  });

  it("envía datos limpios, revalida y redirige a la lista con el aviso", async () => {
    entregar.mockResolvedValueOnce({ status: "ok", data: { codigoPaquete: "PAQ-000123" } });
    await expect(entregarPaqueteAction("p1", idle, fd())).rejects.toMatchObject({
      digest: "/porteria/paquetes?entregado=PAQ-000123",
    });
    expect(entregar).toHaveBeenCalledWith("p1", { codigoRetiro: "482915", recibidoPor: "Carlos Pérez" });
    expect(revalidatePath).toHaveBeenCalledWith("/porteria/paquetes");
  });

  it("código incorrecto queda bajo el campo", async () => {
    entregar.mockResolvedValueOnce({ status: "bad_request", messages: ["Código de retiro incorrecto"] });
    expect(await entregarPaqueteAction("p1", idle, fd())).toEqual({
      status: "error",
      errores: { codigoRetiro: "Código de retiro incorrecto" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("ya entregado refresca la lista y avisa", async () => {
    entregar.mockResolvedValueOnce({ status: "conflict" });
    expect(await entregarPaqueteAction("p1", idle, fd())).toEqual({
      status: "error",
      mensajes: ["Este paquete ya fue entregado"],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/porteria/paquetes");
  });

  it("404, 403 y error genérico", async () => {
    entregar.mockResolvedValueOnce({ status: "not_found" });
    expect((await entregarPaqueteAction("p1", idle, fd())).mensajes).toEqual(["El paquete no existe"]);
    entregar.mockResolvedValueOnce({ status: "forbidden" });
    expect((await entregarPaqueteAction("p1", idle, fd())).mensajes).toEqual([
      "No tienes permiso para esta acción",
    ]);
    entregar.mockResolvedValueOnce({ status: "error" });
    expect((await entregarPaqueteAction("p1", idle, fd())).mensajes).toEqual([
      "No pudimos registrar la entrega. Intenta de nuevo.",
    ]);
  });
});
