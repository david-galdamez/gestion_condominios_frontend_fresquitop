import { beforeEach, describe, expect, it, vi } from "vitest";

const guardar = vi.fn();
const generar = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/cuotas", () => ({
  guardarConfiguracionCuota: (...a: unknown[]) => guardar(...a),
  generarCuotas: (...a: unknown[]) => generar(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { MSG, periodoActual } from "@/lib/validaciones/cuota";
import { generarCuotasAction, guardarConfiguracionAction } from "./cuotas";

const idle = { status: "idle" as const };
const fd = (datos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(datos)) f.set(k, v);
  return f;
};
const config = { montoMensual: 45, diaVencimiento: 10, vigenteDesde: "2026-11-11" };

beforeEach(() => {
  guardar.mockReset();
  generar.mockReset();
  revalidatePath.mockReset();
});

describe("guardarConfiguracionAction", () => {
  it("valida antes de llamar a la API", async () => {
    const r = await guardarConfiguracionAction(idle, fd({ montoMensual: "45", diaVencimiento: "29" }));
    expect(r).toEqual({ status: "error", errores: { diaVencimiento: MSG.dia } });
    expect(guardar).not.toHaveBeenCalled();
  });

  it("envía números y devuelve la configuración guardada", async () => {
    guardar.mockResolvedValue({ status: "ok", data: config });
    const r = await guardarConfiguracionAction(idle, fd({ montoMensual: "45.00", diaVencimiento: "10" }));
    expect(guardar).toHaveBeenCalledWith({ montoMensual: 45, diaVencimiento: 10 });
    expect(r).toEqual({ status: "ok", configuracion: config });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cuotas");
  });

  it("ubica el 400 de la API bajo su campo", async () => {
    guardar.mockResolvedValue({ status: "bad_request", messages: [MSG.monto] });
    const r = await guardarConfiguracionAction(idle, fd({ montoMensual: "45", diaVencimiento: "10" }));
    expect(r).toEqual({ status: "error", errores: { montoMensual: MSG.monto } });
  });

  it("403 muestra el mensaje de permiso", async () => {
    guardar.mockResolvedValue({ status: "forbidden" });
    const r = await guardarConfiguracionAction(idle, fd({ montoMensual: "45", diaVencimiento: "10" }));
    expect(r.mensajes).toEqual(["No tienes permiso para esta acción"]);
  });
});

describe("generarCuotasAction", () => {
  it("rechaza un periodo inválido sin llamar a la API", async () => {
    const r = await generarCuotasAction(idle, fd({ periodo: "2026-13" }));
    expect(r).toEqual({ status: "error", mensajes: [MSG.periodo] });
    expect(generar).not.toHaveBeenCalled();
  });

  it("devuelve el resultado con las omitidas", async () => {
    const periodo = periodoActual();
    generar.mockResolvedValue({ status: "ok", data: { periodo, creadas: 2, omitidas: 1 } });
    const r = await generarCuotasAction(idle, fd({ periodo }));
    expect(generar).toHaveBeenCalledWith(periodo);
    expect(r.status).toBe("ok");
    expect(r.mensajes?.[1]).toBe("Se omitieron 1 unidades que ya tenían cuota");
  });

  it("409 pide guardar la configuración", async () => {
    generar.mockResolvedValue({ status: "conflict" });
    const r = await generarCuotasAction(idle, fd({ periodo: periodoActual() }));
    expect(r).toEqual({
      status: "error",
      mensajes: ["No existe configuración de cuota. Guárdala antes de generar."],
    });
  });

  it("error de red muestra un mensaje genérico", async () => {
    generar.mockResolvedValue({ status: "error" });
    const r = await generarCuotasAction(idle, fd({ periodo: periodoActual() }));
    expect(r.mensajes).toEqual(["No pudimos generar las cuotas. Intenta de nuevo."]);
  });
});
