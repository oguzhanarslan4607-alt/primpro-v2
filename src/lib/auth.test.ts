import { describe, expect, it } from "vitest";
import { verifyLocalPin } from "./auth";

describe("verifyLocalPin", () => {
  it("maps fixed pins to the correct roles", () => {
    expect(verifyLocalPin("1905")).toBe("admin");
    expect(verifyLocalPin("2026")).toBe("user");
  });

  it("rejects unknown pins", () => {
    expect(verifyLocalPin("0000")).toBeNull();
  });
});
