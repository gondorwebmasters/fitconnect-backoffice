import { describe, expect, it } from "vitest";

describe("VITE_FITCONNECT_API_URL environment variable", () => {
  it("is set in the environment", () => {
    const url = process.env.VITE_FITCONNECT_API_URL;
    expect(url).toBeDefined();
    expect(typeof url).toBe("string");
    expect(url!.length).toBeGreaterThan(0);
  });

  it("is a valid URL format", () => {
    const url = process.env.VITE_FITCONNECT_API_URL!;
    expect(url).toMatch(/^https?:\/\/.+/);
  });

  it("ends with /graphql path", () => {
    const url = process.env.VITE_FITCONNECT_API_URL!;
    expect(url).toMatch(/\/graphql$/i);
  });
});
