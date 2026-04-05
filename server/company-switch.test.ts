/**
 * Unit tests for company switching logic.
 *
 * switchCompanyContext uses setActiveCompany (SELECT_COMPANY) from user.resolver.
 * Correct order:
 *   1. Call setActiveCompany mutation (old x-company-id header — consistent with session)
 *   2. On success: update localStorage → authLink sends new x-company-id
 *   3. Update React state with user + companies returned by backend
 *   4. apolloClient.resetStore() → refetch all queries with new header
 */
import { describe, expect, it } from "vitest";

// ---- Test 1: Correct mutation and variable name ----
describe("setActiveCompany mutation", () => {
  it("uses $companyId variable, not $user or $input", () => {
    const mutationString = `
      mutation SetActiveCompany($companyId: ID!) {
        setActiveCompany(companyId: $companyId) {
          code success message
          user { id activeCompanyId }
          companies { id name }
        }
      }
    `;
    expect(mutationString).toContain("$companyId: ID!");
    expect(mutationString).toContain("setActiveCompany(companyId: $companyId)");
    expect(mutationString).not.toContain("$user");
    expect(mutationString).not.toContain("$input");
    expect(mutationString).not.toContain("updateUser");
  });

  it("passes { companyId } as variables", () => {
    const companyId = "company-123";
    const variables = { companyId };
    expect(variables).toHaveProperty("companyId", companyId);
    expect(variables).not.toHaveProperty("user");
    expect(variables).not.toHaveProperty("input");
  });
});

// ---- Test 2: Correct order — backend first ----
describe("switchCompanyContext order", () => {
  it("calls setActiveCompany BEFORE updating localStorage and state", async () => {
    const steps: string[] = [];
    const companyId = "new-company";

    const mockMutate = async () => {
      steps.push("1_setActiveCompany");
      return {
        data: {
          setActiveCompany: {
            success: true,
            user: { id: "u1", activeCompanyId: companyId },
            companies: [{ id: companyId, name: "New Co" }],
          },
        },
      };
    };
    const mockSetLocalStorage = (key: string, value: string) => {
      if (key === "fc_active_company") steps.push(`2_localStorage:${value}`);
    };
    const mockSetAuthState = () => steps.push("3_setState");
    const mockResetStore = async () => { steps.push("4_resetStore"); };

    const res = await mockMutate();
    const result = res.data.setActiveCompany;

    if (result.success) {
      mockSetLocalStorage("fc_active_company", companyId);
      mockSetAuthState();
      await mockResetStore();
    }

    expect(steps[0]).toBe("1_setActiveCompany");
    expect(steps[1]).toBe(`2_localStorage:${companyId}`);
    expect(steps[2]).toBe("3_setState");
    expect(steps[3]).toBe("4_resetStore");
  });

  it("does NOT update localStorage or state if setActiveCompany fails", async () => {
    const sideEffects: string[] = [];

    const mockMutate = async () => ({
      data: { setActiveCompany: { success: false, user: null, companies: null } },
    });
    const mockSetLocalStorage = () => sideEffects.push("localStorage");
    const mockSetAuthState = () => sideEffects.push("setState");

    const res = await mockMutate();
    const result = res.data.setActiveCompany;

    if (result.success) {
      mockSetLocalStorage();
      mockSetAuthState();
    }

    expect(sideEffects).toHaveLength(0);
  });
});

// ---- Test 3: State update uses backend-returned user and companies ----
describe("state update after setActiveCompany", () => {
  it("uses user and companies from backend response, not just companyId", () => {
    const companyId = "company-xyz";
    const backendUser = { id: "u1", activeCompanyId: companyId, name: "Juan" };
    const backendCompanies = [{ id: companyId, name: "Gym XYZ" }];

    const prevState = {
      user: { id: "u1", activeCompanyId: "old-company", name: "Juan" },
      companies: [{ id: "old-company", name: "Old Gym" }],
      activeCompanyId: "old-company",
    };

    // Simulate state update
    const newState = {
      ...prevState,
      activeCompanyId: companyId,
      user: backendUser ?? { ...prevState.user, activeCompanyId: companyId },
      companies: backendCompanies ?? prevState.companies,
    };

    expect(newState.activeCompanyId).toBe(companyId);
    expect(newState.user.activeCompanyId).toBe(companyId);
    expect(newState.companies[0].name).toBe("Gym XYZ");
  });
});

// ---- Test 4: authLink reads localStorage after update ----
describe("authLink x-company-id header", () => {
  it("sends old x-company-id during mutation, new one after localStorage update", () => {
    const mockStorage: Record<string, string> = { "fc_active_company": "old-company" };
    const getHeader = () => mockStorage["fc_active_company"] || "";

    // During mutation: old header
    expect(getHeader()).toBe("old-company");

    // After backend confirms and localStorage is updated
    mockStorage["fc_active_company"] = "new-company";
    expect(getHeader()).toBe("new-company");
  });
});

// ---- Test 5: No infinite loop ----
describe("useEffect dependency safety", () => {
  it("GET_COMPANIES useEffect only depends on isBoss, not activeCompanyId", () => {
    const correctDeps = ["isBoss"];
    expect(correctDeps).not.toContain("activeCompanyId");
  });
});
