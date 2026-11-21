import { beforeEach, describe, expect, it, vi } from "vitest";

const guardar = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/perfil-directorio", () => ({ guardarMiPerfil: (...a: unknown[]) => guardar(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { guardarPerfilDirectorio } from "./perfil-directorio";

const idle = { status: "idle" as const };
function fd(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = { visible: "true", mostrarNombre: "true", mostrarUnidad: "false", mostrarTelefono: "false", mostrarCorreo: "false", ...over };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

beforeEach(() => {
  guardar.mockReset();
  revalidatePath.mockReset();
});

describe("guardarPerfilDirectorio", () => {
  it("valida en el servidor: visible sin datos no llama a la API", async () => {
    expect(await guardarPerfilDirectorio(idle, fd({ mostrarNombre: "false" }))).toEqual({
      status: "error",
      error: "Elige al menos un dato para mostrar",
    });
    expect(guardar).not.toHaveBeenCalled();
  });

  it("datos mal formados -> error general", async () => {
    expect((await guardarPerfilDirectorio(idle, fd({ visible: "si" }))).error).toBe("No pudimos guardar. Intenta de nuevo.");
    expect(guardar).not.toHaveBeenCalled();
  });

  it("ok envía booleanos, revalida y devuelve el perfil", async () => {
    const perfil = { visible: true };
    guardar.mockResolvedValue({ status: "ok", data: perfil });
    expect(await guardarPerfilDirectorio(idle, fd())).toEqual({ status: "ok", perfil });
    expect(guardar).toHaveBeenCalledWith({
      visible: true,
      mostrarNombre: true,
      mostrarUnidad: false,
      mostrarTelefono: false,
      mostrarCorreo: false,
      telefono: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/directorio/mi-perfil");
  });

  it("normaliza el teléfono y lo envía; uno inválido no llama a la API (hotfix 1.0.1)", async () => {
    guardar.mockResolvedValue({ status: "ok", data: { visible: true } });
    await guardarPerfilDirectorio(idle, fd({ telefono: "7044 2727", mostrarTelefono: "true" }));
    expect(guardar).toHaveBeenLastCalledWith(expect.objectContaining({ telefono: "7044-2727", mostrarTelefono: true }));

    guardar.mockClear();
    const r = await guardarPerfilDirectorio(idle, fd({ telefono: "1234" }));
    expect(r.error).toBe("El teléfono debe tener 8 dígitos y empezar con 2, 6 o 7 (ej. 7044-2727)");
    expect(guardar).not.toHaveBeenCalled();
  });

  it("400, 403 y error del servidor", async () => {
    guardar.mockResolvedValueOnce({ status: "bad_request", messages: ["Elige al menos un dato para mostrar"] });
    expect((await guardarPerfilDirectorio(idle, fd())).error).toBe("Elige al menos un dato para mostrar");
    guardar.mockResolvedValueOnce({ status: "forbidden" });
    expect((await guardarPerfilDirectorio(idle, fd())).error).toBe("No tienes permiso para esta acción");
    guardar.mockResolvedValueOnce({ status: "error" });
    expect((await guardarPerfilDirectorio(idle, fd())).error).toBe("No pudimos guardar. Intenta de nuevo.");
  });
});
