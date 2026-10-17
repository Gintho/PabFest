import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/checkout/route";
import { SANDBOX, SITE, json, mockFetch, setTestEnv, tokenRoute, validCompany, validIndividual } from "./helpers";

let ipCounter = 0;
function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: SITE,
      "x-forwarded-for": `10.0.0.${++ipCounter}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const INTENTS = `${SANDBOX}/v5/organizations/mon-asso/checkout-intents`;
const okIntent = () => json({ id: 4242, redirectUrl: "https://www.helloasso-sandbox.com/checkout/abc" });

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

describe("POST /api/checkout", () => {
  it("crée l'intention de paiement et ne renvoie que l'URL de redirection", async () => {
    const { calls } = mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    const res = await POST(req({ donor: validCompany, amountCents: 100000, consent: true }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: "https://www.helloasso-sandbox.com/checkout/abc" });

    // Jeton OAuth2 client_credentials
    const tokenCall = calls.find((c) => c.url.endsWith("/oauth2/token"))!;
    const form = new URLSearchParams(String(tokenCall.init!.body));
    expect(form.get("grant_type")).toBe("client_credentials");

    // Corps du checkout-intent conforme à InitCheckoutBody
    const intentCall = calls.find((c) => c.url === INTENTS)!;
    expect((intentCall.init!.headers as Record<string, string>).Authorization).toBe("Bearer access-123");
    const body = JSON.parse(String(intentCall.init!.body));
    expect(body).toMatchObject({
      totalAmount: 100000,
      initialAmount: 100000,
      containsDonation: true,
      backUrl: `${SITE}/?retour=annule`,
      errorUrl: `${SITE}/erreur`,
      returnUrl: `${SITE}/merci`,
      payer: {
        firstName: "Camille",
        lastName: "Durand",
        email: "camille.durand@example.com",
        companyName: "ACME SAS",
        address: "1 rue de la Paix",
        zipCode: "75002",
        city: "Paris",
        country: "FRA",
      },
      metadata: { source: "onepage-mecenat", donorType: "company", amountCents: 100000, siren: "732829320" },
    });
    expect(body.itemName.length).toBeLessThanOrEqual(250);
  });

  it("n'envoie pas companyName pour un particulier", async () => {
    const { calls } = mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }));
    const body = JSON.parse(String(calls.find((c) => c.url === INTENTS)!.init!.body));
    expect(body.payer.companyName).toBeUndefined();
    expect(body.metadata.siren).toBeUndefined();
  });

  it("ignore toute URL de retour fournie par l'utilisateur", async () => {
    const { calls } = mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    await POST(
      req({ donor: validIndividual, amountCents: 5000, consent: true, returnUrl: "https://evil.example", backUrl: "https://evil.example" }),
    );
    const body = JSON.parse(String(calls.find((c) => c.url === INTENTS)!.init!.body));
    expect(body.returnUrl).toBe(`${SITE}/merci`);
    expect(body.backUrl).toBe(`${SITE}/?retour=annule`);
  });

  it("réutilise le jeton OAuth2 en cache", async () => {
    const { calls } = mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }));
    await POST(req({ donor: validIndividual, amountCents: 6000, consent: true }));
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(1);
  });

  it("borne le montant côté serveur (422 au-delà du maximum)", async () => {
    const { fn } = mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    const res = await POST(req({ donor: validIndividual, amountCents: 50_000 * 100 + 1, consent: true }));
    expect(res.status).toBe(422);
    expect((await res.json()).fields.amountCents).toBeDefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it("422 avec messages de champ sur une saisie invalide", async () => {
    mockFetch({});
    const res = await POST(req({ donor: { ...validIndividual, email: "x" }, amountCents: 5000, consent: true }));
    expect(res.status).toBe(422);
    expect((await res.json()).fields["donor.email"]).toBeDefined();
  });

  it("rejette un JSON malformé", async () => {
    mockFetch({});
    expect((await POST(req("{oops"))).status).toBe(400);
  });

  it("rejette une origine étrangère (CSRF)", async () => {
    const { fn } = mockFetch({});
    const res = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }, { Origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(fn).not.toHaveBeenCalled();
  });

  it("bloque le honeypot sans appeler HelloAsso", async () => {
    const { fn } = mockFetch({});
    const res = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true, website: "http://spam" }));
    expect(res.status).toBe(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("vérifie Turnstile quand il est configuré", async () => {
    setTestEnv({ TURNSTILE_SITE_KEY: "site", TURNSTILE_SECRET_KEY: "secret" });
    mockFetch({
      "https://challenges.cloudflare.com/": () => json({ success: false }),
      ...tokenRoute,
      [INTENTS]: okIntent,
    });
    const res = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true, turnstileToken: "bad" }));
    expect(res.status).toBe(400);
  });

  it("renvoie une erreur générique si HelloAsso échoue, sans fuite de détail", async () => {
    mockFetch({ ...tokenRoute, [INTENTS]: () => json({ errors: [{ code: "x", message: "detail interne" }] }, 400) });
    const res = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }));
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toContain("detail interne");
  });

  it("refuse une redirectUrl hors domaine HelloAsso", async () => {
    mockFetch({ ...tokenRoute, [INTENTS]: () => json({ id: 1, redirectUrl: "https://evil.example/pay" }) });
    const res = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }));
    expect(res.status).toBe(502);
  });

  it("limite le débit par IP (429)", async () => {
    mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await POST(req({ donor: validIndividual, amountCents: 5000, consent: true }, { "x-forwarded-for": "192.0.2.1" }));
      statuses.push(r.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it("ne journalise aucune donnée personnelle ni secret", async () => {
    mockFetch({ ...tokenRoute, [INTENTS]: okIntent });
    const logSpy = vi.spyOn(console, "log");
    await POST(req({ donor: validCompany, amountCents: 5000, consent: true }));
    const out = logSpy.mock.calls.flat().join("\n");
    for (const secret of ["Camille", "Durand", "example.com", "ACME", "rue de la Paix", "732829320", "test-client-secret", "access-123"]) {
      expect(out).not.toContain(secret);
    }
    expect(out).toContain("checkout_created");
  });
});
