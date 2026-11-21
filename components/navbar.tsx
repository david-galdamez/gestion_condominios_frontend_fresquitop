"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/app/actions/auth";

type Enlace = { href: string; label: string };

// Navbar responsive: en pantallas medianas y grandes los enlaces van en una
// segunda fila con salto de línea ordenado; en móvil se pliegan en un menú.
export function Navbar({
  links,
  nombre,
  rolLabel,
  campana,
}: {
  links: Enlace[];
  nombre: string;
  rolLabel: string;
  campana?: ReactNode;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const coincide = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  // Solo el enlace más específico: en /directorio/mi-perfil se marca
  // "Mi directorio" y no también "Directorio" (hotfix 1.0.1).
  const masEspecifico = links
    .map((l) => l.href)
    .filter(coincide)
    .sort((a, b) => b.length - a.length)[0];
  const activo = (href: string) => href === masEspecifico;

  const claseEnlace = (href: string) =>
    `rounded-md px-2.5 py-1.5 text-sm transition-colors ${
      activo(href)
        ? "bg-zinc-100 font-medium text-foreground dark:bg-zinc-800"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-900"
    }`;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-semibold">
          Condominios
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {campana}
          <div className="hidden text-right text-sm leading-tight sm:block">
            <div className="font-medium">{nombre}</div>
            <div className="text-xs text-zinc-500">{rolLabel}</div>
          </div>
          <form action={logout} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Cerrar sesión
            </button>
          </form>
          <button
            type="button"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((a) => !a)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm md:hidden dark:border-zinc-700"
          >
            {abierto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Escritorio / tablet: fila de enlaces con salto de línea. */}
      <nav
        aria-label="Principal"
        className="mx-auto hidden w-full max-w-5xl flex-wrap gap-1 px-4 pb-3 md:flex"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={activo(l.href) ? "page" : undefined}
            className={claseEnlace(l.href)}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Móvil: menú plegable. */}
      <div
        id="menu-movil"
        hidden={!abierto}
        className="border-t border-zinc-200 px-4 pb-4 pt-3 md:hidden dark:border-zinc-800"
      >
        <nav aria-label="Principal" className="grid grid-cols-2 gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAbierto(false)}
              aria-current={activo(l.href) ? "page" : undefined}
              className={claseEnlace(l.href)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 sm:hidden dark:border-zinc-800">
          <div className="text-sm leading-tight">
            <div className="font-medium">{nombre}</div>
            <div className="text-xs text-zinc-500">{rolLabel}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
