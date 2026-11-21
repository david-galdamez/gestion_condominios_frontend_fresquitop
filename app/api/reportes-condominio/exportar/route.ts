import { apiFetch } from "@/lib/api";

const PARAMETROS = ["formato", "version", "desde", "hasta"] as const;

// H20 · El navegador no tiene el token (cookie httpOnly): este handler pide el
// archivo al backend con el token y lo reenvía tal cual (PDF o Excel). Los
// errores se devuelven como JSON { message } con el mismo estado.
export async function GET(request: Request) {
  const entrada = new URL(request.url).searchParams;
  const q = new URLSearchParams();
  for (const p of PARAMETROS) {
    const v = entrada.get(p);
    if (v) q.set(p, v);
  }

  let res: Response;
  try {
    res = await apiFetch(`admin/reportescondominio/exportar?${q.toString()}`);
  } catch (e) {
    // El redirect() de apiFetch (sesión expirada) debe propagarse.
    if (e instanceof Error && "digest" in e) throw e;
    return Response.json({ message: null }, { status: 502 });
  }

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    const m = body?.message;
    const message = Array.isArray(m) ? m.map(String) : typeof m === "string" ? m : null;
    return Response.json({ message }, { status: res.status === 200 ? 502 : res.status });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  });
}
