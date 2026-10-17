import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `after()` n'existe que dans une vraie requête Next.js : on l'exécute et on
// garde la promesse pour pouvoir l'attendre dans les tests.
const pending: Promise<unknown>[] = [];
vi.mock("next/server", async (orig) => {
  const actual = await orig<typeof import("next/server")>();
  return { ...actual, after: (fn: () => Promise<unknown>) => void pending.push(fn()) };
});

import { POST } from "@/app/api/webhook/route";
import { computeSignature, extractCheckoutIntentId } from "@/lib/webhook";
import { SANDBOX, SITE, WEBHOOK_TOKEN, confirmedIntent, json, mockFetch, setTestEnv, tokenRoute } from "./helpers";

const intentUrl = (id: number) => `${SANDBOX}/v5/organizations/mon-asso/checkout-intents/${id}`;

let ip = 0;
function hook(body: unknown, { token = WEBHOOK_TOKEN, headers = {} as Record<string, string> } = {}) {
  return new Request(`${SITE}/api/webhook?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `172.16.0.${++ip % 250}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const orderEvent = (id: number, extra: Record<string, unknown> = {}) => ({
  eventType: "Order",
  data: { id: 9000 + id, checkoutIntentId: id, amount: { total: 1 }, payments: [{ state: "Authorized", amount: 1 }], ...extra },
});

let logs: string[] = [];
beforeEach(() => {
  setTestEnv();
  pending.length = 0;
  logs = [];
  for (const m of ["log", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation((line: string) => void logs.push(line));
  }
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const events = (name: string) => logs.filter((l) => JSON.parse(l).event === name);
const flush = () => Promise.all(pending);

describe("POST /api/webhook", () => {
  it("confirme un don après relecture via GET checkout-intents/{id}", async () => {
    const { calls } = mockFetch({ ...tokenRoute, [intentUrl(101)]: () => json(confirmedIntent(101, 25000)) });
    const res = await POST(hook(orderEvent(101)));
    expect(res.status).toBe(200);
    await flush();
    expect(calls.some((c) => c.url === intentUrl(101))).toBe(true);
    const [line] = events("donation_confirmed");
    expect(JSON.parse(line)).toMatchObject({ checkoutIntentId: 101, amountCents: 25000, orderId: 9101 });
  });

  it("est idempotent : un rejeu (ou Order + Payment) ne produit qu'un seul effet", async () => {
    mockFetch({ ...tokenRoute, [intentUrl(102)]: () => json(confirmedIntent(102, 5000)) });
    await POST(hook(orderEvent(102)));
    await POST(hook(orderEvent(102)));
    await POST(hook({ eventType: "Payment", data: { id: 1, order: { id: 9102, checkoutIntentId: 102 } } }));
    await flush();
    expect(events("donation_confirmed")).toHaveLength(1);
    expect(events("webhook_duplicate_ignored")).toHaveLength(2);
  });

  it("payload falsifié : un Order « Authorized » inventé n'est pas cru si l'API dit autre chose", async () => {
    mockFetch({
      ...tokenRoute,
      [intentUrl(103)]: () => json({ ...confirmedIntent(103, 5000), order: undefined }), // aucun paiement côté HelloAsso
    });
    const res = await POST(hook(orderEvent(103, { amount: { total: 999999 } })));
    expect(res.status).toBe(200);
    await flush();
    expect(events("donation_confirmed")).toHaveLength(0);
    expect(JSON.parse(events("webhook_not_confirmed")[0])).toMatchObject({ status: "pending" });
  });

  it("payload falsifié : un montant payé différent du montant demandé n'est jamais confirmé", async () => {
    const tampered = confirmedIntent(104, 50000);
    tampered.order.amount.total = 100;
    tampered.order.payments[0].amount = 100;
    mockFetch({ ...tokenRoute, [intentUrl(104)]: () => json(tampered) });
    await POST(hook(orderEvent(104)));
    await flush();
    expect(events("donation_confirmed")).toHaveLength(0);
    expect(events("helloasso_amount_mismatch")).toHaveLength(1);
  });

  it("ignore une intention qui n'a pas été créée par ce site", async () => {
    mockFetch({ ...tokenRoute, [intentUrl(105)]: () => json({ ...confirmedIntent(105, 5000), metadata: {} }) });
    await POST(hook(orderEvent(105)));
    await flush();
    expect(events("donation_confirmed")).toHaveLength(0);
  });

  it("rejette un jeton d'URL absent ou faux (401) sans appeler HelloAsso", async () => {
    const { fn } = mockFetch({});
    expect((await POST(hook(orderEvent(106), { token: "faux" }))).status).toBe(401);
    expect(
      (await POST(new Request(`${SITE}/api/webhook`, { method: "POST", body: JSON.stringify(orderEvent(106)) }))).status,
    ).toBe(401);
    expect(fn).not.toHaveBeenCalled();
  });

  it("vérifie la signature x-ha-signature quand une clé est configurée", async () => {
    setTestEnv({ HELLOASSO_WEBHOOK_SIGNATURE_KEY: "sig-key" });
    mockFetch({ ...tokenRoute, [intentUrl(107)]: () => json(confirmedIntent(107, 5000)) });
    const body = JSON.stringify(orderEvent(107));

    expect((await POST(hook(body))).status).toBe(401); // pas de signature
    expect((await POST(hook(body, { headers: { "x-ha-signature": computeSignature(body, "autre-cle") } }))).status).toBe(401);
    // corps modifié après signature
    const sig = computeSignature(body, "sig-key");
    expect((await POST(hook(body.replace("107", "108"), { headers: { "x-ha-signature": sig } }))).status).toBe(401);

    expect((await POST(hook(body, { headers: { "x-ha-signature": sig } }))).status).toBe(200);
    await flush();
    expect(events("donation_confirmed")).toHaveLength(1);
  });

  it("accuse réception sans effet des événements hors checkout", async () => {
    const { fn } = mockFetch({});
    const res = await POST(hook({ eventType: "Form", data: { formSlug: "x" } }));
    expect(res.status).toBe(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it("rejette un JSON invalide", async () => {
    mockFetch({});
    expect((await POST(hook("not-json"))).status).toBe(400);
  });

  it("ne confirme pas si l'API HelloAsso est injoignable", async () => {
    mockFetch({ ...tokenRoute, [intentUrl(109)]: () => json({}, 503) });
    expect((await POST(hook(orderEvent(109)))).status).toBe(200);
    await flush();
    expect(events("donation_confirmed")).toHaveLength(0);
  });
});

describe("extractCheckoutIntentId", () => {
  it("lit Order.data.checkoutIntentId et Payment.data.order.checkoutIntentId", () => {
    expect(extractCheckoutIntentId({ eventType: "Order", data: { checkoutIntentId: 5 } })).toBe(5);
    expect(extractCheckoutIntentId({ eventType: "Payment", data: { order: { checkoutIntentId: "6" } } })).toBe(6);
    expect(extractCheckoutIntentId({ eventType: "Order", data: { checkoutIntentId: -1 } })).toBeNull();
    expect(extractCheckoutIntentId({ eventType: "Form", data: { checkoutIntentId: 5 } })).toBeNull();
    expect(extractCheckoutIntentId(null)).toBeNull();
  });
});
