import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/status/route";
import { evaluateIntent } from "@/lib/helloasso";
import { SANDBOX, SITE, confirmedIntent, json, mockFetch, setTestEnv, tokenRoute } from "./helpers";

beforeEach(() => {
  setTestEnv();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/status", () => {
  it("renvoie le statut relu côté serveur, sans donnée personnelle", async () => {
    mockFetch({
      ...tokenRoute,
      [`${SANDBOX}/v5/organizations/mon-asso/checkout-intents/77`]: () =>
        json({ ...confirmedIntent(77, 3000), order: { ...confirmedIntent(77, 3000).order, payer: { email: "a@b.c" } } }),
    });
    const res = await GET(new Request(`${SITE}/api/status?id=77`));
    expect(await res.json()).toEqual({ status: "confirmed", amountCents: 3000 });
  });

  it("rejette un identifiant non numérique", async () => {
    mockFetch({});
    expect((await GET(new Request(`${SITE}/api/status?id=1;DROP`))).status).toBe(400);
  });
});

describe("evaluateIntent", () => {
  it("pending sans commande, refused si tous les paiements échouent", () => {
    expect(evaluateIntent({ ...confirmedIntent(1, 100), order: undefined }).status).toBe("pending");
    const refused = confirmedIntent(2, 100);
    refused.order.payments = [{ id: 1, amount: 100, state: "Refused" }];
    expect(evaluateIntent(refused).status).toBe("refused");
    expect(evaluateIntent(null).status).toBe("unknown");
  });
});
