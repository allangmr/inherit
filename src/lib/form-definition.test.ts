import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateAll, validateStep } from "./form-definition";

describe("form validation", () => {
  it("rejects an empty identity step", () => {
    const errors = validateStep("identity", {});
    assert.equal(errors.some((error) => error.fieldId === "name"), true);
    assert.equal(errors.some((error) => error.fieldId === "email"), true);
  });

  it("accepts a complete identity step", () => {
    const errors = validateStep("identity", {
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    assert.deepEqual(errors, []);
  });

  it("rejects a malformed email", () => {
    const errors = validateStep("identity", {
      name: "Ada",
      email: "not-an-email",
    });
    assert.equal(errors[0]?.fieldId, "email");
  });

  it("requires a service on the need step", () => {
    const errors = validateStep("need", { format: "video" });
    assert.equal(errors.some((error) => error.fieldId === "service"), true);
  });

  it("validateAll requires the slot", () => {
    const errors = validateAll({
      name: "Ada Lovelace",
      email: "ada@example.com",
      service: "first_consult",
      format: "video",
      consent: true,
    });
    assert.equal(errors.some((error) => error.fieldId === "slotId"), true);
  });
});
