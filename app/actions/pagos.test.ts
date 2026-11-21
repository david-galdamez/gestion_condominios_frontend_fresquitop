import { beforeEach, describe, expect, it, vi } from "vitest";

const pagar = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/pagos", () => ({ pagarCuotas: (...a: unknown[]) => pagar(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { pagarAction } from "./pagos";

const CLAVE = "3f0f6b2e-5c1d-4b8e-9a37-0d2f6a1c4e55";
const idle = { status: "idle" as const };
function fd(over: Record<string, string> = {}, cuotas = ["c1", "c2"]) {
  const f = new FormData();
  for (const c of cuotas) f.append("cuotaIds", c);
  const base = { numero: "4242 4242 4242 4242", vencimiento: "12/39", cvv: "123", titular: " Ana ", clave: CLAVE, ...over };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-17T18:00:00Z"));
  pagar.mockReset();
  revalidatePath.mockReset();
  redirect.mockClear();
});

describe("pagarAction", () => {
  it("valida en el servidor y no llama a la API", async () => {
    const r = await pagarAction(idle, fd({ cvv: "1", vencimiento: "10/26" }, []));
    expect(r.errores).toEqual({
      cuotas: "Marca al menos una cuota",
      vencimiento: "La tarjeta está vencida o la fecha no es válida (MM/AA)",
      cvv: "El CVV debe tener 3 dígitos",
    });
    expect(pagar).not.toHaveBeenCalled();
  });

  it("sin clave válida no cobra", async () => {
    expect((await pagarAction(idle, fd({ clave: "x" }))).mensaje).toMatch(/No pudimos procesar/);
    expect(pagar).not.toHaveBeenCalled();
  });

  it("aprobado: manda tarjeta limpia y la clave, revalida y va al comprobante", async () => {
    pagar.mockResolvedValue({ status: "ok", data: { numeroTransaccion: "TX-20261117-000001" } });
    await expect(pagarAction(idle, fd())).rejects.toThrow("NEXT_REDIRECT");
    expect(pagar).toHaveBeenCalledWith(
      ["c1", "c2"],
      { numero: "4242424242424242", vencimiento: "12/39", cvv: "123", titular: "Ana" },
      CLAVE,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/estado-cuenta");
    expect(redirect).toHaveBeenCalledWith("/pagos/TX-20261117-000001");
  });

  it("rechazado: mensaje con el motivo y la clave usada para cambiarla al reintentar", async () => {
    pagar.mockResolvedValue({ status: "rechazado", motivo: "Fondos insuficientes" });
    expect(await pagarAction(idle, fd())).toEqual({
      status: "rechazado",
      mensaje: "Pago rechazado: fondos insuficientes",
      claveRechazada: CLAVE,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("409, 404/403, 400 y error del servidor", async () => {
    pagar.mockResolvedValueOnce({ status: "conflict", message: "Esta cuota ya fue pagada" });
    expect((await pagarAction(idle, fd())).mensaje).toBe("Esta cuota ya fue pagada");
    pagar.mockResolvedValueOnce({ status: "not_found" });
    expect((await pagarAction(idle, fd())).mensaje).toBe("No tienes permiso para esta acción");
    pagar.mockResolvedValueOnce({ status: "forbidden" });
    expect((await pagarAction(idle, fd())).mensaje).toBe("No tienes permiso para esta acción");
    pagar.mockResolvedValueOnce({ status: "bad_request", messages: ["El CVV debe tener 3 dígitos"] });
    expect((await pagarAction(idle, fd())).errores).toEqual({ cvv: "El CVV debe tener 3 dígitos" });
    pagar.mockResolvedValueOnce({ status: "error" });
    expect((await pagarAction(idle, fd())).mensaje).toBe("No pudimos procesar el pago. Intenta de nuevo.");
  });
});
