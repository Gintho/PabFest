import { NextResponse } from "next/server";

/** IP cliente telle que fournie par la plateforme (Vercel renseigne x-forwarded-for). */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

export function jsonError(status: number, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

export const GENERIC_ERROR = "Une erreur est survenue. Merci de réessayer dans quelques instants.";

/** Lit le corps brut avec une taille maximale (protection contre les gros payloads). */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) return null;
  return text;
}
