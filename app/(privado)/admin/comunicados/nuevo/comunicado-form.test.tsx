import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publicar = vi.fn();
vi.mock("@/app/actions/comunicados", () => ({
  publicarComunicado: (...a: unknown[]) => publicar(...a),
}));

import { ComunicadoForm } from "./comunicado-form";

const torres = [
  { id: "t1", nombre: "Torre A" },
  { id: "t2", nombre: "Torre B" },
  { id: "t3", nombre: "Torre C" },
];
const ahora = "2026-11-17T12:00";

beforeEach(() => publicar.mockReset().mockResolvedValue({ status: "idle" }));

async function llenar(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Título"), "Corte de agua");
  await user.type(screen.getByLabelText("Contenido"), "El sábado no habrá agua.");
  await user.selectOptions(screen.getByLabelText("Categoría"), "AGUA");
}

describe("ComunicadoForm", () => {
  it("muestra los errores de los campos faltantes y no abre la confirmación", async () => {
    const user = userEvent.setup();
    render(<ComunicadoForm torres={torres} ahora={ahora} />);
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    expect(
      screen.getByText("El título debe tener entre 5 y 100 caracteres"),
    ).toBeInTheDocument();
    expect(screen.getByText("Selecciona una categoría")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("el botón dice Programar si la fecha es futura", () => {
    render(<ComunicadoForm torres={torres} ahora={ahora} />);
    fireEvent.change(screen.getByLabelText("Fecha de publicación"), {
      target: { value: "2026-11-20T08:00" },
    });
    expect(screen.getByRole("button", { name: "Programar" })).toBeInTheDocument();
  });

  it("confirma con el número de torres y luego envía", async () => {
    const user = userEvent.setup();
    render(<ComunicadoForm torres={torres} ahora={ahora} />);
    await llenar(user);
    await user.click(screen.getByLabelText("Solo algunas torres"));
    await user.click(screen.getByLabelText("Torre A"));
    await user.click(screen.getByLabelText("Torre C"));
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Se avisará a 2 torres. ¿Continuar?",
    );
    expect(publicar).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Sí, continuar" }));
    await vi.waitFor(() => expect(publicar).toHaveBeenCalledTimes(1));
    const datos = publicar.mock.calls[0][1] as FormData;
    expect(datos.getAll("torreIds")).toEqual(["t1", "t3"]);
  });

  it("todo el condominio cuenta todas las torres", async () => {
    const user = userEvent.setup();
    render(<ComunicadoForm torres={torres} ahora={ahora} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Se avisará a 3 torres");
  });
});
