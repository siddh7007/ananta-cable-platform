import { describe, it, expect } from "@jest/globals";
import { validateCableDesign } from "./cableDesign.js";
import sampleDesign from "../../testing/fixtures/sample-design.json" assert { type: "json" };

describe("validateCableDesign", () => {
  it("validates a correct cable design", () => {
    const result = validateCableDesign(sampleDesign);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(sampleDesign);
    }
  });

  it("rejects invalid cable design", () => {
    const invalidDesign = { 
      id: "x", 
      name: "", 
      cores: 0 
    };
    const result = validateCableDesign(invalidDesign);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => 
        e.message.includes("minimum") || 
        e.message.includes("minLength") ||
        e.path.includes("cores")
      )).toBe(true);
    }
  });
});