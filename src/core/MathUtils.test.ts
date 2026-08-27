import { describe, it, expect } from "vitest";
import { clampAngle } from "./MathUtils";

describe("MathUtils", () => {
  describe("clampAngle", () => {
    it("should not modify an angle within bounds", () => {
      expect(clampAngle(0, -1, 1)).toBe(0);
      expect(clampAngle(0.5, 0, 1)).toBe(0.5);
    });

    it("should clamp an angle that exceeds the maximum", () => {
      expect(clampAngle(1.5, -1, 1)).toBe(1);
    });

    it("should clamp an angle that falls below the minimum", () => {
      expect(clampAngle(-1.5, -1, 1)).toBe(-1);
    });

    it("should handle exact boundary conditions", () => {
      expect(clampAngle(1, -1, 1)).toBe(1);
      expect(clampAngle(-1, -1, 1)).toBe(-1);
    });
  });
});

