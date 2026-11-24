import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const guardarPerfilDirectorio = vi.fn();
vi.mock("@/app/actions/perfil-directorio", () => ({
  guardarPerfilDirectorio: (...a: unknown[]) => guardarPerfilDirectorio(...a),
}));

import type { PerfilDirectorio } from "@/lib/types/perfil-directorio";
import { PerfilForm } from "./perfil-form";

const oculto: PerfilDirectorio = {
  visible: false,
  mostrarNombre: false,
  mostrarUnidad: false,
  mostrarTelefono: false,
  mostrarCorreo: false,
  misDatos: { nombre: "Ana López", unidad: "A-101", telefono: null, correo: "ana@test.com" },
  vistaPrevia: null,
};

beforeEach(() => guardarPerfilDirectorio.mockReset());

const vista = () => screen.getByRole("region", { name: "Vista previa" });

describe("PerfilForm", () => {
  it("por defecto: interruptor apagado, casillas deshabilitadas y 'No apareces en el directorio'", () => {
    render(<PerfilForm perfil={oculto} />);
    expect(screen.getByRole("switch", { name: "Aparecer en el directorio" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Nombre/ })).toBeDisabled();
    expect(vista()).toHaveTextContent("No apareces en el directorio");
  });

  it("muestra los datos propios junto a cada casilla; el teléfono como no registrado", () => {
    render(<PerfilForm perfil={oculto} />);
    expect(screen.getByRole("checkbox", { name: /Nombre/ }).parentElement).toHaveTextContent("Ana López");
    expect(screen.getByRole("checkbox", { name: /Teléfono/ }).parentElement).toHaveTextContent("no registrado");
  });

  it("activar sin marcar datos avisa y deshabilita Guardar", async () => {
    const user = userEvent.setup();
    render(<PerfilForm perfil={oculto} />);
    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("alert")).toHaveTextContent("Elige al menos un dato para mostrar");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("la vista previa se actualiza al marcar, sin esperar al servidor", async () => {
    const user = userEvent.setup();
    render(<PerfilForm perfil={oculto} />);
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("checkbox", { name: /Unidad/ }));
    expect(vista()).toHaveTextContent("A-101");
    expect(vista()).not.toHaveTextContent("Ana López");
    expect(vista()).toHaveTextContent("no se muestra");
    await user.click(screen.getByRole("checkbox", { name: /Teléfono/ }));
    expect(vista()).toHaveTextContent("no registrado");
    expect(guardarPerfilDirectorio).not.toHaveBeenCalled();
  });

  it("Guardar manda las 5 opciones (incluidas las deshabilitadas) y el teléfono, y muestra 'Preferencias guardadas'", async () => {
    const user = userEvent.setup();
    guardarPerfilDirectorio.mockResolvedValue({ status: "ok", perfil: oculto });
    render(<PerfilForm perfil={oculto} />);
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("checkbox", { name: /Correo/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(guardarPerfilDirectorio).toHaveBeenCalledTimes(1));
    const fd: FormData = guardarPerfilDirectorio.mock.calls[0][1];
    expect(Object.fromEntries(fd)).toEqual({
      visible: "true",
      mostrarNombre: "false",
      mostrarUnidad: "false",
      mostrarTelefono: "false",
      mostrarCorreo: "true",
      telefono: "",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Preferencias guardadas");
  });

  it("apagar el interruptor conserva las casillas y permite guardar oculto", async () => {
    const user = userEvent.setup();
    render(<PerfilForm perfil={{ ...oculto, visible: true, mostrarNombre: true }} />);
    expect(vista()).toHaveTextContent("Ana López");
    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("checkbox", { name: /Nombre/ })).toBeChecked();
    expect(vista()).toHaveTextContent("No apareces en el directorio");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("el error del servidor se muestra", async () => {
    const user = userEvent.setup();
    guardarPerfilDirectorio.mockResolvedValue({ status: "error", error: "No pudimos guardar. Intenta de nuevo." });
    render(<PerfilForm perfil={{ ...oculto, visible: true, mostrarNombre: true }} />);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos guardar. Intenta de nuevo.");
  });

  describe("teléfono (hotfix 1.0.1)", () => {
    it("muestra el teléfono guardado y lo actualiza en la vista previa al escribir", async () => {
      const user = userEvent.setup();
      render(
        <PerfilForm
          perfil={{ ...oculto, visible: true, mostrarTelefono: true, misDatos: { ...oculto.misDatos, telefono: "2222-3333" } }}
        />,
      );
      const campo = screen.getByRole("textbox", { name: "Teléfono" });
      expect(campo).toHaveValue("2222-3333");
      expect(vista()).toHaveTextContent("2222-3333");
      await user.clear(campo);
      await user.type(campo, "70442727");
      expect(vista()).toHaveTextContent("7044-2727");
      expect(screen.getByRole("checkbox", { name: /Teléfono/ }).parentElement).toHaveTextContent("7044-2727");
    });

    it("formato inválido avisa y deshabilita Guardar", async () => {
      const user = userEvent.setup();
      render(<PerfilForm perfil={{ ...oculto, visible: true, mostrarNombre: true }} />);
      await user.type(screen.getByRole("textbox", { name: "Teléfono" }), "1234");
      expect(screen.getByRole("alert")).toHaveTextContent("El teléfono debe tener 8 dígitos");
      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });

    it("marcar Teléfono sin registrarlo avisa", async () => {
      const user = userEvent.setup();
      render(<PerfilForm perfil={{ ...oculto, visible: true }} />);
      await user.click(screen.getByRole("checkbox", { name: /Teléfono/ }));
      expect(screen.getByRole("alert")).toHaveTextContent("Registra tu teléfono para poder mostrarlo");
    });

    it("Guardar envía el teléfono escrito", async () => {
      const user = userEvent.setup();
      guardarPerfilDirectorio.mockResolvedValue({ status: "ok", perfil: oculto });
      render(<PerfilForm perfil={{ ...oculto, visible: true, mostrarNombre: true }} />);
      await user.type(screen.getByRole("textbox", { name: "Teléfono" }), "7044 2727");
      await user.click(screen.getByRole("button", { name: "Guardar" }));
      await waitFor(() => expect(guardarPerfilDirectorio).toHaveBeenCalledTimes(1));
      expect((guardarPerfilDirectorio.mock.calls[0][1] as FormData).get("telefono")).toBe("7044 2727");
    });
  });
});
