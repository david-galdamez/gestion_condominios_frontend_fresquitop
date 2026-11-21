import { beforeEach, describe, expect, it, vi } from "vitest";

const conCodigo = vi.fn();
const sinCodigo = vi.fn();
const salida = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
});
vi.mock("@/lib/accesos", () => ({
  registrarEntradaConCodigo: (...a: unknown[]) => conCodigo(...a),
  registrarEntradaSinCodigo: (...a: unknown[]) => sinCodigo(...a),
  registrarSalida: (...a: unknown[]) => salida(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { MSG } from "@/lib/validaciones/acceso";
import {
  registrarEntradaCodigoAction,
  registrarEntradaSinCodigoAction,
  registrarSalidaAction,
} from "./accesos";

const fd = (datos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(datos)) f.set(k, v);
  return f;
};
const ID = "6f1c2b0e-8a54-4a8e-9d1b-1f0f3c2a7b11";
const acceso = {
  id: ID,
  horaEntrada: "2026-11-11T20:05:00.000Z",
  horaSalida: "2026-11-11T22:30:00.000Z",
};
// Ejecuta la acción y devuelve la URL del redirect.
const destino = async (p: Promise<unknown>) => {
  await expect(p).rejects.toThrow("NEXT_REDIRECT");
  return String(redirect.mock.calls.at(-1)?.[0]);
};

beforeEach(() => {
  conCodigo.mockReset();
  sinCodigo.mockReset();
  salida.mockReset();
  revalidatePath.mockReset();
  redirect.mockClear();
});

describe("registrarEntradaCodigoAction", () => {
  it("éxito: vuelve a la búsqueda limpia con la hora local", async () => {
    conCodigo.mockResolvedValue({ status: "ok", data: acceso });
    const url = await destino(registrarEntradaCodigoAction(fd({ codigo: "048213", q: "048213" })));
    expect(conCodigo).toHaveBeenCalledWith("048213");
    expect(url).toBe("/porteria/accesos?aviso=entrada&hora=14%3A05");
    expect(revalidatePath).toHaveBeenCalledWith("/porteria/accesos");
  });

  it("409 conserva la búsqueda y traduce el mensaje a su clave", async () => {
    conCodigo.mockResolvedValue({ status: "conflict", message: "Código no válido: está usado" });
    const url = await destino(registrarEntradaCodigoAction(fd({ codigo: "048213", q: "048213" })));
    expect(url).toBe("/porteria/accesos?error=usado&q=048213");
  });

  it("código mal formado no llama a la API", async () => {
    await destino(registrarEntradaCodigoAction(fd({ codigo: "12", q: "" })));
    expect(conCodigo).not.toHaveBeenCalled();
  });

  it("error de red muestra el mensaje genérico", async () => {
    conCodigo.mockResolvedValue({ status: "error" });
    const url = await destino(registrarEntradaCodigoAction(fd({ codigo: "048213", q: "" })));
    expect(url).toBe("/porteria/accesos?error=entrada");
  });
});

describe("registrarSalidaAction", () => {
  it("éxito con la hora de salida", async () => {
    salida.mockResolvedValue({ status: "ok", data: acceso });
    const url = await destino(registrarSalidaAction(fd({ id: ID, q: "01234567-8" })));
    expect(url).toBe("/porteria/accesos?aviso=salida&hora=16%3A30");
  });

  it("409: ya registró su salida", async () => {
    salida.mockResolvedValue({ status: "conflict", message: "" });
    const url = await destino(registrarSalidaAction(fd({ id: ID, q: "x12" })));
    expect(url).toBe("/porteria/accesos?error=ya_salio&q=x12");
  });
});

describe("registrarEntradaSinCodigoAction", () => {
  const idle = { status: "idle" as const };
  const datos = {
    nombre: "Ana López",
    tipoDocumento: "DUI",
    numeroDocumento: "01234567-8",
    unidadId: ID,
    motivo: "Entrega de documentos",
  };

  it("valida antes de llamar a la API", async () => {
    const r = await registrarEntradaSinCodigoAction(idle, fd({ ...datos, motivo: "Hola" }));
    expect(r).toEqual({ status: "error", errores: { motivo: MSG.motivo } });
    expect(sinCodigo).not.toHaveBeenCalled();
  });

  it("éxito redirige con el aviso de entrada", async () => {
    sinCodigo.mockResolvedValue({ status: "ok", data: acceso });
    const url = await destino(registrarEntradaSinCodigoAction(idle, fd(datos)));
    expect(sinCodigo).toHaveBeenCalledWith(datos);
    expect(url).toContain("aviso=entrada");
  });

  it("404 marca la unidad", async () => {
    sinCodigo.mockResolvedValue({ status: "not_found" });
    const r = await registrarEntradaSinCodigoAction(idle, fd(datos));
    expect(r).toEqual({ status: "error", errores: { unidadId: MSG.unidad } });
  });

  it("403 muestra el mensaje de permiso", async () => {
    sinCodigo.mockResolvedValue({ status: "forbidden" });
    const r = await registrarEntradaSinCodigoAction(idle, fd(datos));
    expect(r.mensajes).toEqual(["No tienes permiso para esta acción"]);
  });
});
