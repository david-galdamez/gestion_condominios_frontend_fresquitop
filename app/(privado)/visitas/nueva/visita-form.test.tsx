import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearVisita = vi.fn();
const editarVisita = vi.fn();
vi.mock("@/app/actions/visitas", () => ({
  crearVisita: (...a: unknown[]) => crearVisita(...a),
  editarVisita: (...a: unknown[]) => editarVisita(...a),
}));

import { VisitaForm } from "./visita-form";

const una = [{ id: "u1", codigo: "A-101" }];
const dos = [...una, { id: "u2", codigo: "B-202" }];
const props = { hoy: "2026-11-04", maxFecha: "2026-12-04" };

beforeEach(() => crearVisita.mockReset());

const set = (label: string, v: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

async function llenar(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre del visitante"), "Ana Pérez");
  await user.type(screen.getByLabelText("Número de documento"), "123456789");
  set("Fecha de visita", "2026-11-10");
  set("Hora estimada", "10:00");
}

describe("VisitaForm", () => {
  it("una unidad: texto fijo y sin select; varias: select", () => {
    const { unmount } = render(<VisitaForm unidades={una} {...props} />);
    expect(screen.getByText("Unidad A-101")).toBeInTheDocument();
    expect(screen.queryByLabelText("Unidad")).not.toBeInTheDocument();
    unmount();
    render(<VisitaForm unidades={dos} {...props} />);
    expect(screen.getByLabelText("Unidad")).toBeInTheDocument();
  });

  it("fecha con min=hoy y max=hoy+30", () => {
    render(<VisitaForm unidades={una} {...props} />);
    const f = screen.getByLabelText("Fecha de visita");
    expect(f).toHaveAttribute("min", "2026-11-04");
    expect(f).toHaveAttribute("max", "2026-12-04");
  });

  it("máscara de DUI al escribir y limpia al cambiar de tipo", async () => {
    const user = userEvent.setup();
    render(<VisitaForm unidades={una} {...props} />);
    const num = screen.getByLabelText("Número de documento");
    await user.type(num, "123456789");
    expect(num).toHaveValue("12345678-9");
    await user.selectOptions(screen.getByLabelText("Tipo de documento"), "PASAPORTE");
    expect(num).toHaveValue("");
    await user.type(num, "ab12cd");
    expect(num).toHaveValue("AB12CD");
  });

  it("envío vacío muestra errores por campo y no llama a la acción", async () => {
    const user = userEvent.setup();
    render(<VisitaForm unidades={dos} {...props} />);
    await user.click(screen.getByRole("button", { name: "Autorizar visita" }));
    expect(screen.getByLabelText("Unidad")).toHaveAccessibleDescription("Selecciona una unidad");
    expect(
      screen.getByText("El nombre debe tener entre 3 y 60 caracteres"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El número de documento no tiene el formato correcto"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Elige una fecha entre hoy y los próximos 30 días"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingresa una hora válida")).toBeInTheDocument();
    expect(crearVisita).not.toHaveBeenCalled();
  });

  it("blur valida el campo", async () => {
    const user = userEvent.setup();
    render(<VisitaForm unidades={una} {...props} />);
    await user.type(screen.getByLabelText("Nombre del visitante"), "ab");
    await user.tab();
    expect(
      screen.getByText("El nombre debe tener entre 3 y 60 caracteres"),
    ).toBeInTheDocument();
  });

  it("tras éxito muestra la tarjeta del código y permite autorizar otra", async () => {
    const user = userEvent.setup();
    crearVisita.mockResolvedValue({
      status: "ok",
      autorizacion: {
        id: "a1",
        codigo: "482915",
        nombre: "Ana Pérez",
        fechaVisita: "2026-11-10",
        horaEstimada: "10:00",
        unidad: { id: "u1", codigo: "A-101" },
      },
    });
    render(<VisitaForm unidades={una} {...props} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Autorizar visita" }));

    expect(await screen.findByText("482 915")).toBeInTheDocument();
    expect(screen.getByText("Válido solo el 10/11/2026")).toBeInTheDocument();
    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText("Unidad A-101")).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver mis visitas" })).toHaveAttribute("href", "/visitas");

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: /Copiar código/ }));
    expect(writeText).toHaveBeenCalledWith("482915");
    expect(await screen.findByText("¡Copiado!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Autorizar otra visita" }));
    expect(screen.getByLabelText("Nombre del visitante")).toHaveValue("");
  });

  it("errores de la API aparecen arriba y conservan lo escrito", async () => {
    const user = userEvent.setup();
    crearVisita.mockResolvedValue({
      status: "error",
      mensajes: ["No tienes unidades asignadas"],
    });
    render(<VisitaForm unidades={una} {...props} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Autorizar visita" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes unidades asignadas");
    expect(screen.getByLabelText("Nombre del visitante")).toHaveValue("Ana Pérez");
  });

  describe("modo edición (H07b)", () => {
    const a = {
      id: "a1",
      codigo: "111111",
      nombre: "Ana Pérez",
      tipoDocumento: "DUI" as const,
      numeroDocumento: "12345678-9",
      placa: "P123",
      fechaVisita: "2026-11-10",
      horaEstimada: "10:00",
      estado: "VIGENTE" as const,
      unidad: { id: "u2", codigo: "B-202" },
    };

    it("precarga los datos, unidad fija y botón Guardar cambios", () => {
      render(<VisitaForm unidades={dos} {...props} autorizacion={a} />);
      expect(screen.getByLabelText("Nombre del visitante")).toHaveValue("Ana Pérez");
      expect(screen.getByLabelText("Placa (opcional)")).toHaveValue("P123");
      expect(screen.getByLabelText("Fecha de visita")).toHaveValue("2026-11-10");
      expect(screen.getByText("Unidad B-202")).toBeInTheDocument();
      expect(screen.queryByLabelText("Unidad")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
    });

    it("al guardar con fecha nueva avisa que el código anterior dejó de funcionar", async () => {
      editarVisita.mockResolvedValue({
        status: "ok",
        codigoNuevo: true,
        autorizacion: { ...a, codigo: "222222", fechaVisita: "2026-11-12" },
      });
      const user = userEvent.setup();
      render(<VisitaForm unidades={dos} {...props} autorizacion={a} />);
      set("Fecha de visita", "2026-11-12");
      await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      expect(await screen.findByText(/el anterior dejó de funcionar/)).toBeInTheDocument();
      expect(screen.getByTestId("codigo")).toHaveTextContent("222 222");
      expect(editarVisita.mock.calls[0][0]).toBe("a1");
      expect(editarVisita.mock.calls[0][1]).toBe("111111");
      expect(crearVisita).not.toHaveBeenCalled();
    });
  });
});
