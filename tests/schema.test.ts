import { describe, expect, it } from "vitest";
import { buildDonationSchema, eurosToCents, fieldErrors } from "@/lib/schema";
import { validCompany, validIndividual } from "./helpers";

const schema = buildDonationSchema(50_000 * 100);
const base = { amountCents: 5000, consent: true };

describe("validation du don (zod)", () => {
  it("accepte une entreprise valide et normalise email et SIREN", () => {
    const r = schema.parse({ ...base, donor: validCompany });
    expect(r.donor.email).toBe("camille.durand@example.com");
    expect(r.donor.donorType === "company" && r.donor.siren).toBe("732829320");
  });

  it("accepte un particulier valide (apostrophes, tirets)", () => {
    expect(schema.safeParse({ ...base, donor: validIndividual }).success).toBe(true);
  });

  it("SIREN facultatif mais 9 chiffres s'il est fourni", () => {
    expect(schema.safeParse({ ...base, donor: { ...validCompany, siren: "" } }).success).toBe(true);
    const bad = schema.safeParse({ ...base, donor: { ...validCompany, siren: "1234" } });
    expect(bad.success).toBe(false);
    expect(fieldErrors(bad.error!)["donor.siren"]).toMatch(/9 chiffres/);
  });

  it("raison sociale obligatoire pour une entreprise", () => {
    const { companyName, ...rest } = validCompany;
    void companyName;
    const r = schema.safeParse({ ...base, donor: rest });
    expect(fieldErrors(r.error!)["donor.companyName"]).toBeDefined();
  });

  it("refuse un type de donateur inconnu", () => {
    expect(schema.safeParse({ ...base, donor: { ...validIndividual, donorType: "autre" } }).success).toBe(false);
  });

  it("exige le consentement RGPD", () => {
    const r = schema.safeParse({ ...base, consent: false, donor: validIndividual });
    expect(fieldErrors(r.error!).consent).toMatch(/consentement/);
  });

  it("borne le montant : min 1 €, max configurable, entier en centimes", () => {
    const at = (amountCents: number) => schema.safeParse({ ...base, amountCents, donor: validIndividual }).success;
    expect(at(99)).toBe(false);
    expect(at(100)).toBe(true);
    expect(at(5_000_000)).toBe(true);
    expect(at(5_000_001)).toBe(false);
    expect(at(10.5)).toBe(false);
    expect(buildDonationSchema(1000).safeParse({ ...base, amountCents: 1001, donor: validIndividual }).success).toBe(false);
  });

  it("refuse email, code postal et pays invalides", () => {
    const errs = fieldErrors(
      schema.safeParse({
        ...base,
        donor: { ...validIndividual, email: "pas-un-email", zipCode: "<>", country: "XXX" },
      }).error!,
    );
    expect(Object.keys(errs).sort()).toEqual(["donor.country", "donor.email", "donor.zipCode"]);
  });

  it("refuse les noms contenant chiffres ou balises", () => {
    expect(schema.safeParse({ ...base, donor: { ...validIndividual, lastName: "<script>" } }).success).toBe(false);
    expect(schema.safeParse({ ...base, donor: { ...validIndividual, firstName: "J3an" } }).success).toBe(false);
  });

  it("convertit les euros saisis en centimes", () => {
    expect(eurosToCents("50")).toBe(5000);
    expect(eurosToCents("12,5")).toBe(1250);
    expect(eurosToCents("1 000")).toBe(100000);
    expect(eurosToCents("0.333")).toBeNull();
    expect(eurosToCents("abc")).toBeNull();
  });
});
