import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registrarPaqueteAction = vi.fn();
vi.mock("@/app/actions/paquetes", () => ({
  registrarPaqueteAction: (...a: unknown[]) => registrarPaqueteAction(...a),
}));

import { PaqueteForm } from "./paquete-form";

const unidades = [
  { id: "u1", codigo: "A-101" },
  { id: "u2", codigo: "B-205" },
];
const png = (size = 100) => {
  const f = new File([new Uint8Array(4)], "etiqueta.png", { type: "image/png" });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

beforeEach(() => {
  registrarPaqueteAction.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:vista");
  URL.revokeObjectURL = vi.fn();
});

async function llenar(user: ReturnType<typeof userEvent.setup>, foto: File | null = png()) {
  await user.selectOptions(screen.getByLabelText("Unidad"), "u1");
  await user.selectOptions(screen.getByLabelText("Mensajería"), "DHL");
  await user.type(screen.getByLabelText("Destinatario (nombre de la etiqueta)"), "Carlos Pérez");
  if (foto) await user.upload(screen.getByLabelText("Foto del paquete (JPG o PNG, hasta 5 MB)"), foto);
}

describe("PaqueteForm", () => {
  it("lista las unidades y las 6 mensajerías", () => {
    render(<PaqueteForm unidades={unidades} />);
    expect(screen.getByRole("option", { name: "B-205" })).toBeInTheDocument();
    // 6 mensajerías + la opción vacía.
    expect(screen.getByLabelText("Mensajería").querySelectorAll("option")).toHaveLength(7);
  });

  it("envío vacío muestra errores por campo y no llama a la acción", async () => {
    const user = userEvent.setup();
    render(<PaqueteForm unidades={unidades} />);
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(screen.getByLabelText("Unidad")).toHaveAccessibleDescription("Selecciona una unidad");
    expect(screen.getByText("El destinatario debe tener entre 3 y 60 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Elige una mensajería de la lista")).toBeInTheDocument();
    expect(screen.getByText("Solo JPG o PNG de hasta 5 MB")).toBeInTheDocument();
    expect(registrarPaqueteAction).not.toHaveBeenCalled();
  });

  it("rechaza al adjuntar un PDF o una foto de más de 5 MB", () => {
    render(<PaqueteForm unidades={unidades} />);
    const input = screen.getByLabelText("Foto del paquete (JPG o PNG, hasta 5 MB)");
    const pdf = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(input).toHaveAccessibleDescription("Solo JPG o PNG de hasta 5 MB");
    fireEvent.change(input, { target: { files: [png(5 * 1024 * 1024 + 1)] } });
    expect(input).toHaveAccessibleDescription("Solo JPG o PNG de hasta 5 MB");
    expect(screen.queryByText("etiqueta.png")).not.toBeInTheDocument();
  });

  it("una foto válida muestra la vista previa", async () => {
    const user = userEvent.setup();
    render(<PaqueteForm unidades={unidades} />);
    await user.upload(screen.getByLabelText("Foto del paquete (JPG o PNG, hasta 5 MB)"), png());
    expect(screen.getByText("etiqueta.png")).toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de la foto")).toHaveAttribute("src", "blob:vista");
  });

  it("con todo válido llama a la acción con los campos y la foto", async () => {
    const user = userEvent.setup();
    registrarPaqueteAction.mockResolvedValue({ status: "idle" });
    render(<PaqueteForm unidades={unidades} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    await waitFor(() => expect(registrarPaqueteAction).toHaveBeenCalledTimes(1));
    const fd: FormData = registrarPaqueteAction.mock.calls[0][1];
    expect(fd.get("unidadId")).toBe("u1");
    expect(fd.get("mensajeria")).toBe("DHL");
    expect(fd.get("destinatario")).toBe("Carlos Pérez");
    expect((fd.get("foto") as File).name).toBe("etiqueta.png");
  });

  it("el 409 del servidor sale bajo la unidad y se conserva la foto", async () => {
    const user = userEvent.setup();
    registrarPaqueteAction.mockResolvedValue({
      status: "error",
      errores: { unidadId: "La unidad no tiene residentes registrados" },
    });
    render(<PaqueteForm unidades={unidades} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByText("La unidad no tiene residentes registrados")).toBeInTheDocument();
    expect(screen.getByText("etiqueta.png")).toBeInTheDocument();
    expect(screen.getByLabelText("Destinatario (nombre de la etiqueta)")).toHaveValue("Carlos Pérez");
  });

  it("los errores generales del servidor salen arriba", async () => {
    const user = userEvent.setup();
    registrarPaqueteAction.mockResolvedValue({
      status: "error",
      mensajes: ["No pudimos registrar el paquete. Intenta de nuevo."],
    });
    render(<PaqueteForm unidades={unidades} />);
    await llenar(user);
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos registrar el paquete. Intenta de nuevo.");
  });
});
