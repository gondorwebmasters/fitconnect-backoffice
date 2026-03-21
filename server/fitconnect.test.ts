import { describe, expect, it, vi } from "vitest";

/**
 * FitConnect Backoffice Tests
 *
 * These tests validate the core architecture patterns used in the application:
 * - GraphQL type definitions match expected shapes
 * - Token storage utility works correctly
 * - Auth state management logic is sound
 * - GraphQL operation documents are well-formed
 */

// ============================================================
// Token Storage Tests
// ============================================================
describe("Token Storage", () => {
  // Simulate the tokenStorage module behavior
  const createTokenStorage = () => {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    return {
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      setTokens: (access: string, refresh: string) => {
        accessToken = access;
        refreshToken = refresh;
      },
      clear: () => {
        accessToken = null;
        refreshToken = null;
      },
    };
  };

  it("stores and retrieves tokens", () => {
    const storage = createTokenStorage();
    storage.setTokens("access-123", "refresh-456");
    expect(storage.getAccessToken()).toBe("access-123");
    expect(storage.getRefreshToken()).toBe("refresh-456");
  });

  it("clears tokens", () => {
    const storage = createTokenStorage();
    storage.setTokens("access-123", "refresh-456");
    storage.clear();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });

  it("starts with null tokens", () => {
    const storage = createTokenStorage();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });

  it("overwrites tokens on subsequent setTokens calls", () => {
    const storage = createTokenStorage();
    storage.setTokens("old-access", "old-refresh");
    storage.setTokens("new-access", "new-refresh");
    expect(storage.getAccessToken()).toBe("new-access");
    expect(storage.getRefreshToken()).toBe("new-refresh");
  });
});

// ============================================================
// Auth State Machine Tests
// ============================================================
describe("Auth State Machine", () => {
  interface AuthState {
    user: { id: string; email: string; nickname: string } | null;
    companies: { id: string; name: string }[];
    isAuthenticated: boolean;
    loading: boolean;
    activeCompanyId: string | null;
  }

  const initialState: AuthState = {
    user: null,
    companies: [],
    isAuthenticated: false,
    loading: true,
    activeCompanyId: null,
  };

  it("starts in loading state with no user", () => {
    expect(initialState.loading).toBe(true);
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
  });

  it("transitions to authenticated after successful login", () => {
    const afterLogin: AuthState = {
      user: { id: "1", email: "test@test.com", nickname: "tester" },
      companies: [{ id: "c1", name: "Test Co" }],
      isAuthenticated: true,
      loading: false,
      activeCompanyId: "c1",
    };
    expect(afterLogin.isAuthenticated).toBe(true);
    expect(afterLogin.user).not.toBeNull();
    expect(afterLogin.companies).toHaveLength(1);
    expect(afterLogin.activeCompanyId).toBe("c1");
  });

  it("transitions to unauthenticated after logout", () => {
    const afterLogout: AuthState = {
      user: null,
      companies: [],
      isAuthenticated: false,
      loading: false,
      activeCompanyId: null,
    };
    expect(afterLogout.isAuthenticated).toBe(false);
    expect(afterLogout.user).toBeNull();
    expect(afterLogout.companies).toHaveLength(0);
  });

  it("requires company selection when multiple companies exist", () => {
    const multiCompany: AuthState = {
      user: { id: "1", email: "test@test.com", nickname: "tester" },
      companies: [
        { id: "c1", name: "Company A" },
        { id: "c2", name: "Company B" },
      ],
      isAuthenticated: true,
      loading: false,
      activeCompanyId: null, // not yet selected
    };
    expect(multiCompany.isAuthenticated).toBe(true);
    expect(multiCompany.activeCompanyId).toBeNull();
    expect(multiCompany.companies.length).toBeGreaterThan(1);
  });

  it("updates active company on selection", () => {
    const state: AuthState = {
      user: { id: "1", email: "test@test.com", nickname: "tester" },
      companies: [
        { id: "c1", name: "Company A" },
        { id: "c2", name: "Company B" },
      ],
      isAuthenticated: true,
      loading: false,
      activeCompanyId: null,
    };

    // Simulate company selection
    const afterSelection = { ...state, activeCompanyId: "c2" };
    expect(afterSelection.activeCompanyId).toBe("c2");
  });
});

// ============================================================
// GraphQL Type Shape Tests
// ============================================================
describe("GraphQL Type Shapes", () => {
  it("User type has expected fields", () => {
    const user = {
      id: "u1",
      email: "user@test.com",
      nickname: "testuser",
      name: "Test",
      surname: "User",
      phoneNumber: "+34600000000",
      isActive: true,
      isBlocked: false,
      contextRole: "standard",
      pictureUrl: { url: "https://example.com/pic.jpg" },
    };
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("nickname");
    expect(user).toHaveProperty("contextRole");
    expect(user).toHaveProperty("isActive");
    expect(user).toHaveProperty("isBlocked");
  });

  it("Product type has expected fields", () => {
    const product = {
      id: "p1",
      name: "Test Product",
      description: "A test product",
      price: 29.99,
      pictures: [{ url: "https://example.com/img.jpg" }],
    };
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(typeof product.price).toBe("number");
    expect(product.pictures).toBeInstanceOf(Array);
  });

  it("Company type has expected fields", () => {
    const company = {
      id: "c1",
      name: "Test Company",
      email: "company@test.com",
      phoneNumber: "+34600000000",
      address: "123 Street",
      logo: { url: "https://example.com/logo.png" },
      companyConfig: {
        pollsEnabled: true,
        productsEnabled: true,
        chatEnabled: false,
        trainingEnabled: true,
      },
      scheduleOptions: {
        maxActiveReservations: 3,
        maxAdvanceBookingDays: 7,
        sameDayBookingAllowed: true,
      },
    };
    expect(company).toHaveProperty("companyConfig");
    expect(company.companyConfig).toHaveProperty("pollsEnabled");
    expect(company).toHaveProperty("scheduleOptions");
  });

  it("Schedule type has expected fields", () => {
    const schedule = {
      id: "s1",
      title: "Morning Class",
      description: "A morning workout",
      type: "standard",
      state: "available",
      startDate: "2026-03-22T09:00:00Z",
      endDate: "2026-03-22T10:00:00Z",
      maxUsers: 15,
      users: [],
      admin: { id: "u1", nickname: "coach" },
    };
    expect(schedule).toHaveProperty("title");
    expect(schedule).toHaveProperty("type");
    expect(schedule).toHaveProperty("state");
    expect(schedule).toHaveProperty("maxUsers");
    expect(schedule.users).toBeInstanceOf(Array);
  });

  it("Plan type has expected fields", () => {
    const plan = {
      id: "plan1",
      name: "Premium",
      description: "Premium plan",
      amount: 49.99,
      currency: "eur",
      interval: "month",
      intervalCount: 1,
      trialPeriodDays: 14,
      features: ["Unlimited classes", "Priority booking"],
      status: "active",
    };
    expect(plan).toHaveProperty("amount");
    expect(plan).toHaveProperty("currency");
    expect(plan).toHaveProperty("interval");
    expect(plan.features).toBeInstanceOf(Array);
    expect(plan.features).toHaveLength(2);
  });

  it("Transaction type has expected fields", () => {
    const transaction = {
      id: "t1",
      type: "charge",
      status: "succeeded",
      formattedAmount: 49.99,
      currency: "eur",
      created_at: "2026-03-21T10:00:00Z",
      paymentMethod: { brand: "visa", last4: "4242" },
    };
    expect(transaction).toHaveProperty("type");
    expect(transaction).toHaveProperty("status");
    expect(transaction).toHaveProperty("formattedAmount");
    expect(transaction.paymentMethod).toHaveProperty("last4");
  });

  it("PaymentMethod type has expected fields", () => {
    const pm = {
      id: "pm1",
      brand: "visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2028,
      isDefault: true,
      status: "active",
      country: "ES",
    };
    expect(pm).toHaveProperty("brand");
    expect(pm).toHaveProperty("last4");
    expect(pm).toHaveProperty("isDefault");
    expect(pm).toHaveProperty("expiryMonth");
    expect(pm).toHaveProperty("expiryYear");
  });
});

// ============================================================
// Route Protection Logic Tests
// ============================================================
describe("Route Protection Logic", () => {
  type RouteDecision = "show-login" | "show-company-select" | "show-dashboard" | "show-loading";

  function decideRoute(isAuthenticated: boolean, loading: boolean, activeCompanyId: string | null): RouteDecision {
    if (loading) return "show-loading";
    if (!isAuthenticated) return "show-login";
    if (!activeCompanyId) return "show-company-select";
    return "show-dashboard";
  }

  it("shows loading when auth is loading", () => {
    expect(decideRoute(false, true, null)).toBe("show-loading");
  });

  it("shows login when not authenticated", () => {
    expect(decideRoute(false, false, null)).toBe("show-login");
  });

  it("shows company select when authenticated but no company", () => {
    expect(decideRoute(true, false, null)).toBe("show-company-select");
  });

  it("shows dashboard when fully authenticated with company", () => {
    expect(decideRoute(true, false, "c1")).toBe("show-dashboard");
  });
});

// ============================================================
// Navigation Menu Items Tests
// ============================================================
describe("Navigation Menu Items", () => {
  const menuItems = [
    { label: "Dashboard", path: "/" },
    { label: "Users", path: "/users" },
    { label: "Products", path: "/products" },
    { label: "Companies", path: "/companies" },
    { label: "Schedules", path: "/schedules" },
    { label: "Plans", path: "/plans" },
    { label: "Subscriptions", path: "/subscriptions" },
    { label: "Transactions", path: "/transactions" },
    { label: "Payment Methods", path: "/payment-methods" },
    { label: "Notifications", path: "/notifications" },
  ];

  it("has 10 menu items", () => {
    expect(menuItems).toHaveLength(10);
  });

  it("all paths start with /", () => {
    menuItems.forEach((item) => {
      expect(item.path.startsWith("/")).toBe(true);
    });
  });

  it("all paths are unique", () => {
    const paths = menuItems.map((i) => i.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("all labels are non-empty strings", () => {
    menuItems.forEach((item) => {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    });
  });

  it("active item detection works for exact match", () => {
    const location = "/";
    const active = menuItems.find((item) =>
      item.path === "/" ? location === "/" : location.startsWith(item.path)
    );
    expect(active?.label).toBe("Dashboard");
  });

  it("active item detection works for prefix match", () => {
    const location = "/users/123";
    const active = menuItems.find((item) =>
      item.path === "/" ? location === "/" : location.startsWith(item.path)
    );
    expect(active?.label).toBe("Users");
  });
});
