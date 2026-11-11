import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registrarEntradaSinCodigoAction = vi.fn();
vi.mock("@/app/actions/accesos", () => ({
  registrarEntradaCodigoAction: vi.fn(),
  registrarSalidaAction: vi.fn(),
  registrarEntradaSinCodigoAction: (...a: unknown[]) => registrarEntradaSinCodigoAction(...a),
}));

import type { Acceso } from "@/lib/types/accesos";
import type { Autorizacion } from "@/lib/types/visitas";
import { VisitanteForm } from "./nuevo/visitante-form";
import { ListaAutorizaciones, ListaDentro } from "./resultados";

const HOY = "2026-11-11";
const aut = (extra: Partial<Autorizacion> = {}): Autorizacion => ({
  id: "a-1",
  codigo: "048213",
  nombre: "María Pérez",
  tipoDocumento: "DUI",
  numeroDocumento: "01234567-8",
  placa: null,
  fechaVisita: HOY,
  horaEstimada: "10:00",
  estado: "VIGENTE",
  unidad: { id: "u-1", codigo: "A-101" },
  ...extra,
});

beforeEach(() => registrarEntradaSinCodigoAction.mockReset());

describe("ListaAutorizaciones", () => {
  it("muestra los datos y el botón solo si está vigente y es de hoy", () => {
    render(
      <ListaAutorizaciones
        q="01234567-8"
        hoy={HOY}
        autorizaciones={[
          aut(),
          aut({ id: "a-2", codigo: "111111", estado: "USADA" }),
          aut({ id: "a-3", codigo: "222222", fechaVisita: "2026-11-12" }),
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("María Pérez")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Unidad A-101/)).toBeInTheDocument();
    expect(within(items[0]).getByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();
    expect(within(items[1]).getByText("Usada")).toBeInTheDocument();
    expect(within(items[1]).queryByRole("button")).toBeNull();
    expect(within(items[2]).queryByRole("button")).toBeNull();
  });

  it("el formulario envía el código y la búsqueda", () => {
    const { container } = render(<ListaAutorizaciones q="048213" hoy={HOY} autorizaciones={[aut()]} />);
    expect(container.querySelector('input[name="codigo"]')).toHaveValue("048213");
    expect(container.querySelector('input[name="q"]')).toHaveValue("048213");
  });
});

describe("ListaDentro", () => {
  const dentro: Acceso = {
    id: "r-1",
    nombre: "Ana López",
    tipoDocumento: "DUI",
    numeroDocumento: "07654321-0",
    unidad: "A-102",
    motivo: "Entrega de documentos",
    preautorizado: false,
    estado: "DENTRO",
    horaEntrada: "2026-11-11T20:05:00.000Z",
    horaSalida: null,
  };

  it("muestra la hora local de entrada, el motivo y el botón de salida", () => {
    const { container } = render(<ListaDentro q="07654321-0" accesos={[dentro]} />);
    expect(screen.getByText(/Entró a las 14:05/)).toBeInTheDocument();
    expect(screen.getByText(/No pre-autorizado: Entrega de documentos/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar salida" })).toBeInTheDocument();
    expect(container.querySelector('input[name="id"]')).toHaveValue("r-1");
  });
});

describe("VisitanteForm", () => {
  const unidades = [
    { id: "u-1", codigo: "A-101" },
    { id: "u-2", codigo: "A-102" },
  ];

  it("envío vacío muestra los errores y no llama a la acción", async () => {
    const user = userEvent.setup();
    render(<VisitanteForm unidades={unidades} />);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(screen.getByLabelText("Motivo de la visita")).toHaveAccessibleDescription(
      "El motivo debe tener entre 5 y 100 caracteres",
    );
    expect(screen.getByLabelText("Unidad visitada")).toHaveAccessibleDescription(
      "Selecciona la unidad visitada",
    );
    expect(registrarEntradaSinCodigoAction).not.toHaveBeenCalled();
  });

  it("datos válidos llaman a la acción", async () => {
    registrarEntradaSinCodigoAction.mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<VisitanteForm unidades={unidades} />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana López");
    await user.type(screen.getByLabelText("Número de documento"), "01234567-8");
    await user.selectOptions(screen.getByLabelText("Unidad visitada"), "u-2");
    await user.type(screen.getByLabelText("Motivo de la visita"), "Entrega de documentos");
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(registrarEntradaSinCodigoAction).toHaveBeenCalledTimes(1);
    const enviado = registrarEntradaSinCodigoAction.mock.calls[0][1] as FormData;
    expect(enviado.get("unidadId")).toBe("u-2");
  });

  it("muestra el error de la API arriba del formulario", async () => {
    registrarEntradaSinCodigoAction.mockResolvedValue({
      status: "error",
      mensajes: ["No pudimos registrar la entrada. Intenta de nuevo."],
    });
    const user = userEvent.setup();
    render(<VisitanteForm unidades={unidades} />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana López");
    await user.type(screen.getByLabelText("Número de documento"), "01234567-8");
    await user.selectOptions(screen.getByLabelText("Unidad visitada"), "u-1");
    await user.type(screen.getByLabelText("Motivo de la visita"), "Entrega de documentos");
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos registrar la entrada");
  });
});
