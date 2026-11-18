import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pagarAction = vi.fn();
vi.mock("@/app/actions/pagos", () => ({ pagarAction: (...a: unknown[]) => pagarAction(...a) }));

import type { CuotaPorPagar } from "@/lib/types/pagos";
import { PagoForm } from "./pago-form";

const cuotas: CuotaPorPagar[] = [
  { id: "c1", periodo: "2026-09", monto: 45, fechaVencimiento: "2026-09-10", estado: "VENCIDA" },
  { id: "c2", periodo: "2026-10", monto: 45, fechaVencimiento: "2026-10-10", estado: "VENCIDA" },
  { id: "c3", periodo: "2026-11", monto: 60.5, fechaVencimiento: "2026-11-10", estado: "PENDIENTE" },
];
const props = { cuotas, preseleccion: [] as string[], mesActual: "2026-11" };

beforeEach(() => pagarAction.mockReset());

async function llenarTarjeta(user: ReturnType<typeof userEvent.setup>, numero = "4242424242424242") {
  await user.type(screen.getByLabelText("Número de tarjeta"), numero);
  await user.type(screen.getByLabelText("Vencimiento (MM/AA)"), "1239");
  await user.type(screen.getByLabelText("CVV"), "123");
  await user.type(screen.getByLabelText("Titular"), "Ana López");
}
const marcar = (user: ReturnType<typeof userEvent.setup>, periodo: RegExp) =>
  user.click(screen.getByRole("checkbox", { name: periodo }));

describe("PagoForm", () => {
  it("ninguna cuota marcada al entrar: total $0 y Pagar deshabilitado", () => {
    render(<PagoForm {...props} />);
    for (const c of screen.getAllByRole("checkbox")) expect(c).not.toBeChecked();
    expect(screen.getByTestId("total")).toHaveTextContent("0.00");
    expect(screen.getByRole("button", { name: /Pagar/ })).toBeDisabled();
  });

  it("la cuota que viene de Estado de cuenta llega marcada", () => {
    render(<PagoForm {...props} preseleccion={["c3"]} />);
    expect(screen.getByRole("checkbox", { name: /Noviembre 2026/ })).toBeChecked();
    expect(screen.getByTestId("total")).toHaveTextContent("60.50");
  });

  it("el total es la suma de las cuotas marcadas y aparece en el botón", async () => {
    const user = userEvent.setup();
    render(<PagoForm {...props} />);
    await marcar(user, /Septiembre 2026/);
    await marcar(user, /Noviembre 2026/);
    expect(screen.getByTestId("total")).toHaveTextContent("105.50");
    expect(screen.getByRole("button", { name: /Pagar .*105\.50/ })).toBeInTheDocument();
  });

  it("máscaras: número en grupos de 4, vencimiento con barra y CVV oculto", async () => {
    const user = userEvent.setup();
    render(<PagoForm {...props} />);
    await llenarTarjeta(user);
    expect(screen.getByLabelText("Número de tarjeta")).toHaveValue("4242 4242 4242 4242");
    expect(screen.getByLabelText("Vencimiento (MM/AA)")).toHaveValue("12/39");
    expect(screen.getByLabelText("CVV")).toHaveAttribute("type", "password");
  });

  it("valida al salir del campo (vencimiento pasado)", async () => {
    const user = userEvent.setup();
    render(<PagoForm {...props} />);
    await user.type(screen.getByLabelText("Vencimiento (MM/AA)"), "1026");
    await user.tab();
    expect(screen.getByText("La tarjeta está vencida o la fecha no es válida (MM/AA)")).toBeInTheDocument();
  });

  it("con todo completo envía cuotas, tarjeta y una clave uuid una sola vez", async () => {
    const user = userEvent.setup();
    pagarAction.mockResolvedValue({ status: "idle" });
    render(<PagoForm {...props} />);
    await marcar(user, /Septiembre 2026/);
    await marcar(user, /Octubre 2026/);
    await llenarTarjeta(user);
    await user.dblClick(screen.getByRole("button", { name: /Pagar/ }));
    await waitFor(() => expect(pagarAction).toHaveBeenCalledTimes(1));
    const fd: FormData = pagarAction.mock.calls[0][1];
    expect(fd.getAll("cuotaIds")).toEqual(["c1", "c2"]);
    expect(fd.get("numero")).toBe("4242 4242 4242 4242");
    expect(fd.get("clave")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rechazo: muestra el motivo, conserva las cuotas y reintenta con otra clave", async () => {
    const user = userEvent.setup();
    render(<PagoForm {...props} />);
    await marcar(user, /Septiembre 2026/);
    await llenarTarjeta(user, "4000000000000002");
    pagarAction.mockImplementation(async (_prev?: unknown, fd?: FormData) => ({
      status: "rechazado",
      mensaje: "Pago rechazado: fondos insuficientes",
      claveRechazada: fd?.get("clave"),
    }));
    await user.click(screen.getByRole("button", { name: /Pagar/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Pago rechazado: fondos insuficientes");
    expect(screen.getByRole("checkbox", { name: /Septiembre 2026/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /Pagar/ }));
    await waitFor(() => expect(pagarAction).toHaveBeenCalledTimes(2));
    const primera = (pagarAction.mock.calls[0][1] as FormData).get("clave");
    const segunda = (pagarAction.mock.calls[1][1] as FormData).get("clave");
    expect(segunda).not.toBe(primera);
  });
});
