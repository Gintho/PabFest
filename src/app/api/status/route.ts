import { NextResponse } from "next/server";
import { fetchDonationStatus } from "@/lib/helloasso";
import { clientIp, jsonError } from "@/lib/http";
import { log } from "@/lib/log";
import { limiters } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Statut d'un don, relu côté serveur auprès de HelloAsso. Ne renvoie aucune donnée personnelle. */
export async function GET(req: Request) {
  if (!limiters.status(clientIp(req)).ok) return jsonError(429, "Trop de requêtes.");

  const idParam = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d{1,15}$/.test(idParam)) return jsonError(400, "Requête invalide.");

  const result = await fetchDonationStatus(Number(idParam));
  if (result.status === "unknown") log.warn("status_unknown", { checkoutIntentId: result.id });
  return NextResponse.json({ status: result.status, amountCents: result.amountCents ?? null });
}
