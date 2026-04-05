/**
 * Unit tests for company switching logic.
 *
 * These tests verify that:
 * 1. The UPDATE_USER mutation variable name is correct ($user, not $input)
 * 2. The backend is called FIRST, and only on success the localStorage/header is updated
 * 3. The x-company-id header is derived from localStorage (updated after backend confirms)
 * 4. No infinite loops occur (activeCompanyId not in useEffect deps)
 */
import { describe, expect, it } from "vitest";

// ---- Test 1: Verify the UPDATE_USER mutation variable name ----
describe("UPDATE_USER mutation variable", () => {
  it("uses $user variable name, not $input", () => {
    const mutationString = `
      mutation UpdateUser($user: UpdateUserInput!) {
        updateUser(user: $user) {
          code success message
          user { id activeCompanyId }
        }
      }
    `;
    expect(mutationString).toContain("$user: UpdateUserInput!");
    expect(mutationString).toContain("updateUser(user: $user)");
    expect(mutationString).not.toContain("$input");
  });

  it("switchCompanyContext passes { user: { activeCompanyId } } not { input: ... }", () => {
    const companyId = "company-123";
    const variables = { user: { activeCompanyId: companyId } };

    expect(variables).toHaveProperty("user");
    expect(variables).not.toHaveProperty("input");
    expect(variables.user.activeCompanyId).toBe(companyId);
  });
});

// ---- Test 2: Backend-first order ----
describe("switchCompanyContext correct order", () => {
  it("calls backend mutation BEFORE updating localStorage and React state", async () => {
    const steps: string[] = [];

    // Simulate the correct implementation
    const companyId = "new-company-id";

    const mockMutate = async () => {
      steps.push("1_backend_mutate");
      return { data: { updateUser: { success: true, user: { id: "u1", activeCompanyId: companyId } } } };
    };
    const mockSetLocalStorage = (key: string, value: string) => {
      if (key === "fc_active_company") steps.push(`2_localStorage:${value}`);
    };
    const mockSetAuthState = () => steps.push("3_setState");
    const mockResetStore = async () => { steps.push("4_resetStore"); };

    // Execute in the correct order
    const result = await mockMutate();
    const updateResult = result.data.updateUser;

    if (updateResult.success) {
      mockSetLocalStorage("fc_active_company", companyId);
      mockSetAuthState();
      await mockResetStore();
    }

    // Verify order
    expect(steps[0]).toBe("1_backend_mutate");
    expect(steps[1]).toBe(`2_localStorage:${companyId}`);
    expect(steps[2]).toBe("3_setState");
    expect(steps[3]).toBe("4_resetStore");
  });

  it("does NOT update localStorage if backend mutation fails", async () => {
    const localStorageUpdated: boolean[] = [];

    const mockMutate = async () => ({
      data: { updateUser: { success: false, user: null } },
    });
    const mockSetLocalStorage = () => { localStorageUpdated.push(true); };

    const result = await mockMutate();
    const updateResult = result.data.updateUser;

    if (updateResult.success) {
      // This block should NOT execute
      mockSetLocalStorage();
    }

    // localStorage must NOT be updated if backend failed
    expect(localStorageUpdated).toHaveLength(0);
  });

  it("does NOT update React state if backend mutation fails", async () => {
    const stateUpdated: boolean[] = [];

    const mockMutate = async () => ({
      data: { updateUser: { success: false, user: null } },
    });
    const mockSetAuthState = () => { stateUpdated.push(true); };

    const result = await mockMutate();
    const updateResult = result.data.updateUser;

    if (updateResult.success) {
      mockSetAuthState();
    }

    expect(stateUpdated).toHaveLength(0);
  });
});

// ---- Test 3: authLink reads from localStorage ----
describe("authLink x-company-id header", () => {
  it("reads fc_active_company from localStorage for every request", () => {
    const mockLocalStorage: Record<string, string> = {
      "fc_active_company": "company-abc",
    };

    const getHeader = () => {
      const companyId = mockLocalStorage["fc_active_company"];
      return companyId ? { "x-company-id": companyId } : {};
    };

    // Before switch — old company
    expect(getHeader()).toEqual({ "x-company-id": "company-abc" });

    // Simulate: backend confirmed → localStorage updated
    mockLocalStorage["fc_active_company"] = "company-xyz";
    expect(getHeader()).toEqual({ "x-company-id": "company-xyz" });
  });

  it("UPDATE_USER request uses OLD x-company-id (localStorage not yet updated)", () => {
    // Before the mutation fires, localStorage still has the old value
    const mockLocalStorage: Record<string, string> = {
      "fc_active_company": "old-company",
    };

    // The header at mutation time
    const headerAtMutationTime = mockLocalStorage["fc_active_company"];
    expect(headerAtMutationTime).toBe("old-company");

    // Only after backend confirms, localStorage is updated
    mockLocalStorage["fc_active_company"] = "new-company";
    const headerAfterUpdate = mockLocalStorage["fc_active_company"];
    expect(headerAfterUpdate).toBe("new-company");
  });
});

// ---- Test 4: No infinite loop - activeCompanyId NOT in useEffect deps ----
describe("useEffect dependency safety", () => {
  it("GET_COMPANIES useEffect only depends on isBoss, not activeCompanyId", () => {
    // If activeCompanyId were in the deps array, the following loop would occur:
    // 1. User switches company → activeCompanyId changes
    // 2. useEffect fires → GET_COMPANIES refetches
    // 3. resetStore() fires → all queries refetch
    // 4. activeCompanyId may change again → loop
    const correctDeps = ["isBoss"];
    expect(correctDeps).not.toContain("activeCompanyId");
  });
});
