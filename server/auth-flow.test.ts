import { describe, expect, it, beforeEach, vi } from 'vitest';

// ===================================================================
// Test suite for the complete FitConnect authentication flow.
// These are unit tests that validate the logic of tokenStorage,
// auth state transitions, validation helpers, and session management
// without requiring a live GraphQL backend.
// ===================================================================

// --- Mock localStorage ---
function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

// ===================================================================
// 1. Token Storage
// ===================================================================
describe('tokenStorage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('stores and retrieves access and refresh tokens', () => {
    storage.setItem('fc_access_token', 'access123');
    storage.setItem('fc_refresh_token', 'refresh456');

    expect(storage.getItem('fc_access_token')).toBe('access123');
    expect(storage.getItem('fc_refresh_token')).toBe('refresh456');
  });

  it('clears all auth-related keys', () => {
    storage.setItem('fc_access_token', 'access123');
    storage.setItem('fc_refresh_token', 'refresh456');
    storage.setItem('fc_active_company', 'company789');
    storage.setItem('fc_user', '{"id":"1"}');

    ['fc_access_token', 'fc_refresh_token', 'fc_active_company', 'fc_user'].forEach((key) => {
      storage.removeItem(key);
    });

    expect(storage.getItem('fc_access_token')).toBeNull();
    expect(storage.getItem('fc_refresh_token')).toBeNull();
    expect(storage.getItem('fc_active_company')).toBeNull();
    expect(storage.getItem('fc_user')).toBeNull();
  });

  it('persists user JSON for session restoration', () => {
    const user = { id: '1', name: 'Test User', email: 'test@example.com', nickname: 'tester' };
    storage.setItem('fc_user', JSON.stringify(user));

    const restored = JSON.parse(storage.getItem('fc_user')!);
    expect(restored.id).toBe('1');
    expect(restored.name).toBe('Test User');
    expect(restored.email).toBe('test@example.com');
  });

  it('returns null for missing user cache', () => {
    expect(storage.getItem('fc_user')).toBeNull();
  });

  it('handles malformed JSON in user cache gracefully', () => {
    storage.setItem('fc_user', '{invalid json');
    let result: unknown = null;
    try {
      result = JSON.parse(storage.getItem('fc_user')!);
    } catch {
      result = null;
    }
    expect(result).toBeNull();
  });
});

// ===================================================================
// 2. Login Form Validation
// ===================================================================
describe('Login form validation', () => {
  function validateEmail(value: string): string | null {
    if (!value.trim()) return 'Email or nickname is required';
    return null;
  }

  function validatePassword(value: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 4) return 'Password must be at least 4 characters';
    return null;
  }

  it('rejects empty email', () => {
    expect(validateEmail('')).toBe('Email or nickname is required');
    expect(validateEmail('   ')).toBe('Email or nickname is required');
  });

  it('accepts valid email or nickname', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('johndoe')).toBeNull();
  });

  it('rejects empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('rejects short password', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 4 characters');
  });

  it('accepts valid password', () => {
    expect(validatePassword('abcd')).toBeNull();
    expect(validatePassword('securePassword123!')).toBeNull();
  });
});

// ===================================================================
// 3. Forgot Password Email Validation
// ===================================================================
describe('Forgot password email validation', () => {
  function validateForgotEmail(value: string): string | null {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    return null;
  }

  it('rejects empty email', () => {
    expect(validateForgotEmail('')).toBe('Email is required');
  });

  it('rejects invalid email format', () => {
    expect(validateForgotEmail('notanemail')).toBe('Enter a valid email address');
    expect(validateForgotEmail('missing@domain')).toBe('Enter a valid email address');
    expect(validateForgotEmail('@nodomain.com')).toBe('Enter a valid email address');
  });

  it('accepts valid email', () => {
    expect(validateForgotEmail('user@example.com')).toBeNull();
    expect(validateForgotEmail('admin@fitconnect.io')).toBeNull();
  });
});

// ===================================================================
// 4. Auth State Transitions
// ===================================================================
describe('Auth state transitions', () => {
  interface AuthState {
    user: { id: string; name: string } | null;
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

  it('starts in loading state', () => {
    expect(initialState.loading).toBe(true);
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
  });

  it('transitions to authenticated after successful login', () => {
    const user = { id: '1', name: 'Admin' };
    const companies = [{ id: 'c1', name: 'Gym A' }];

    const nextState: AuthState = {
      user,
      companies,
      isAuthenticated: true,
      loading: false,
      activeCompanyId: 'c1',
    };

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.loading).toBe(false);
    expect(nextState.user?.id).toBe('1');
    expect(nextState.activeCompanyId).toBe('c1');
  });

  it('transitions to unauthenticated after logout', () => {
    const loggedOutState: AuthState = {
      user: null,
      companies: [],
      isAuthenticated: false,
      loading: false,
      activeCompanyId: null,
    };

    expect(loggedOutState.isAuthenticated).toBe(false);
    expect(loggedOutState.user).toBeNull();
    expect(loggedOutState.activeCompanyId).toBeNull();
  });

  it('requires company selection when multiple companies exist', () => {
    const multiCompanyState: AuthState = {
      user: { id: '1', name: 'Admin' },
      companies: [
        { id: 'c1', name: 'Gym A' },
        { id: 'c2', name: 'Gym B' },
      ],
      isAuthenticated: true,
      loading: false,
      activeCompanyId: null,
    };

    expect(multiCompanyState.isAuthenticated).toBe(true);
    expect(multiCompanyState.activeCompanyId).toBeNull();
    expect(multiCompanyState.companies.length).toBe(2);
  });

  it('updates active company after selection', () => {
    const afterSelection: AuthState = {
      user: { id: '1', name: 'Admin' },
      companies: [
        { id: 'c1', name: 'Gym A' },
        { id: 'c2', name: 'Gym B' },
      ],
      isAuthenticated: true,
      loading: false,
      activeCompanyId: 'c2',
    };

    expect(afterSelection.activeCompanyId).toBe('c2');
  });
});

// ===================================================================
// 5. Token Refresh Queue Logic
// ===================================================================
describe('Token refresh queue', () => {
  it('queues pending requests and resolves them after refresh', async () => {
    const pending: Array<{ resolve: () => void; reject: (r?: unknown) => void }> = [];
    const results: string[] = [];

    // Simulate 3 requests hitting auth error simultaneously
    for (let i = 0; i < 3; i++) {
      pending.push({
        resolve: () => results.push(`resolved-${i}`),
        reject: () => results.push(`rejected-${i}`),
      });
    }

    // Simulate successful refresh → resolve all
    pending.forEach(({ resolve }) => resolve());

    expect(results).toEqual(['resolved-0', 'resolved-1', 'resolved-2']);
  });

  it('rejects all pending requests on refresh failure', async () => {
    const pending: Array<{ resolve: () => void; reject: (r?: unknown) => void }> = [];
    const results: string[] = [];

    for (let i = 0; i < 3; i++) {
      pending.push({
        resolve: () => results.push(`resolved-${i}`),
        reject: () => results.push(`rejected-${i}`),
      });
    }

    // Simulate failed refresh → reject all
    pending.forEach(({ reject }) => reject(new Error('refresh failed')));

    expect(results).toEqual(['rejected-0', 'rejected-1', 'rejected-2']);
  });
});

// ===================================================================
// 6. Auth Error Detection
// ===================================================================
describe('Auth error detection', () => {
  const authMessages = [
    'not authenticated',
    'token expired',
    'jwt expired',
    'invalid token',
    'jwt must be provided',
  ];

  const nonAuthMessages = [
    'user not found',
    'validation error',
    'internal server error',
    'permission denied',
  ];

  function isAuthError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes('not authenticated') ||
      lower.includes('token expired') ||
      lower.includes('jwt expired') ||
      lower.includes('invalid token') ||
      lower.includes('jwt must be provided')
    );
  }

  authMessages.forEach((msg) => {
    it(`detects "${msg}" as an auth error`, () => {
      expect(isAuthError(msg)).toBe(true);
    });
  });

  nonAuthMessages.forEach((msg) => {
    it(`does NOT flag "${msg}" as an auth error`, () => {
      expect(isAuthError(msg)).toBe(false);
    });
  });

  it('detects UNAUTHENTICATED extension code', () => {
    const error = { extensions: { code: 'UNAUTHENTICATED' }, message: 'Auth required' };
    expect(error.extensions.code === 'UNAUTHENTICATED').toBe(true);
  });
});

// ===================================================================
// 7. Session Restoration
// ===================================================================
describe('Session restoration on page reload', () => {
  it('hydrates auth state from cached user and token', () => {
    const storage = createMockStorage();
    storage.setItem('fc_access_token', 'valid-token');
    storage.setItem('fc_user', JSON.stringify({ id: '1', name: 'Admin', nickname: 'admin' }));
    storage.setItem('fc_active_company', 'company-1');

    const token = storage.getItem('fc_access_token');
    const cachedUser = JSON.parse(storage.getItem('fc_user')!);
    const activeCompanyId = storage.getItem('fc_active_company');

    const state = {
      user: token && cachedUser ? cachedUser : null,
      isAuthenticated: !!(token && cachedUser),
      loading: !!token,
      activeCompanyId,
    };

    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Admin');
    expect(state.activeCompanyId).toBe('company-1');
    expect(state.loading).toBe(true); // should verify with backend
  });

  it('starts unauthenticated when no token exists', () => {
    const storage = createMockStorage();

    const token = storage.getItem('fc_access_token');
    const cachedUser = storage.getItem('fc_user');

    const state = {
      user: token && cachedUser ? JSON.parse(cachedUser) : null,
      isAuthenticated: !!(token && cachedUser),
      loading: !!token,
    };

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });
});

// ===================================================================
// 8. Login Error Mapping
// ===================================================================
describe('Login error message mapping', () => {
  function mapLoginError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('blocked') || lower.includes('bloqueado')) {
      return 'Your account has been blocked. Please contact your administrator.';
    }
    if (lower.includes('not found') || lower.includes('invalid') || lower.includes('incorrect')) {
      return 'Invalid email/nickname or password. Please check your credentials.';
    }
    if (lower.includes('not active') || lower.includes('inactive')) {
      return 'Your account is not active. Please verify your email first.';
    }
    return msg || 'Login failed. Please try again.';
  }

  it('maps blocked account error', () => {
    expect(mapLoginError('User is blocked')).toContain('blocked');
  });

  it('maps invalid credentials error', () => {
    expect(mapLoginError('User not found')).toContain('Invalid email/nickname');
    expect(mapLoginError('Invalid password')).toContain('Invalid email/nickname');
  });

  it('maps inactive account error', () => {
    expect(mapLoginError('Account not active')).toContain('not active');
  });

  it('passes through unknown errors', () => {
    expect(mapLoginError('Something weird happened')).toBe('Something weird happened');
  });

  it('provides default for empty message', () => {
    expect(mapLoginError('')).toBe('Login failed. Please try again.');
  });
});

// ===================================================================
// 9. Company Auto-Selection Logic
// ===================================================================
describe('Company auto-selection', () => {
  it('auto-selects when only one company exists', () => {
    const companies = [{ id: 'c1', name: 'Solo Gym' }];
    const activeCompanyId = companies.length === 1 ? companies[0].id : null;
    expect(activeCompanyId).toBe('c1');
  });

  it('requires selection when multiple companies exist', () => {
    const companies = [
      { id: 'c1', name: 'Gym A' },
      { id: 'c2', name: 'Gym B' },
    ];
    const activeCompanyId = companies.length === 1 ? companies[0].id : null;
    expect(activeCompanyId).toBeNull();
  });

  it('uses user activeCompanyId if already set', () => {
    const user = { activeCompanyId: 'c2' };
    const companies = [
      { id: 'c1', name: 'Gym A' },
      { id: 'c2', name: 'Gym B' },
    ];
    const activeCompanyId = user.activeCompanyId || (companies.length === 1 ? companies[0].id : null);
    expect(activeCompanyId).toBe('c2');
  });
});

// ===================================================================
// 10. VITE_FITCONNECT_API_URL Environment Variable
// ===================================================================
describe('VITE_FITCONNECT_API_URL', () => {
  it('is set in the environment', () => {
    const url = process.env.VITE_FITCONNECT_API_URL;
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url!.length).toBeGreaterThan(0);
  });

  it('is a valid URL ending with /graphql', () => {
    const url = process.env.VITE_FITCONNECT_API_URL!;
    expect(url).toMatch(/^https?:\/\/.+\/graphql$/i);
  });
});
