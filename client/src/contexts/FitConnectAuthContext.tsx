import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient, tokenStorage } from '../graphql/apollo-client';
import { LOGIN, ME, SELECT_COMPANY, FORGOT_PASSWORD, UPDATE_USER } from '../graphql/operations';
import type { User, Company, LoginResponse, MeResponse } from '../graphql/types';

// ===== Auth state shape =====
interface AuthState {
  user: User | null;
  companies: Company[];
  isAuthenticated: boolean;
  loading: boolean;
  activeCompanyId: string | null;
}

// ===== Context API =====
interface AuthContextType extends AuthState {
  login: (emailOrNickname: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  /** For regular users: calls SELECT_COMPANY mutation to set the user's active company on the backend */
  selectCompany: (companyId: string) => Promise<void>;
  /**
   * For boss role ONLY: switches the active company context by calling UPDATE_USER mutation.
   * Updates the user's activeCompanyId in the backend, updates localStorage, and resets the Apollo cache.
   */
  switchCompanyContext: (companyId: string, companyName?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===== Provider =====
export function FitConnectAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Hydrate from localStorage for instant UI on reload (optimistic)
    const cachedUser = tokenStorage.getUser<User>();
    const token = tokenStorage.getAccessToken();
    const activeCompanyId = localStorage.getItem('fc_active_company');

    return {
      user: token && cachedUser ? cachedUser : null,
      companies: [],
      isAuthenticated: !!(token && cachedUser),
      loading: !!token, // only loading if we have a token to verify
      activeCompanyId,
    };
  });

  // Prevent double-fetch on mount in strict mode
  const didMount = useRef(false);

  // ===== Fetch current user from backend =====
  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: ME,
        fetchPolicy: 'network-only',
      });
      const meData = (data as Record<string, unknown>)?.me as MeResponse | undefined;

      if (meData?.success && meData.user) {
        // Persist user to localStorage for session restoration
        tokenStorage.setUser(meData.user);

        // Preserve activeCompanyId from localStorage (set by switchCompanyContext or previous session)
        // This ensures that if user switched company and reloaded, they stay in that company
        const savedCompanyId = localStorage.getItem('fc_active_company');
        const activeCompanyId = savedCompanyId || meData.user.activeCompanyId || null;

        setAuthState({
          user: meData.user,
          companies: meData.companies || [],
          isAuthenticated: true,
          loading: false,
          activeCompanyId,
        });
      } else {
        // Token is invalid or expired — clear everything
        tokenStorage.clear();
        setAuthState({
          user: null,
          companies: [],
          isAuthenticated: false,
          loading: false,
          activeCompanyId: null,
        });
      }
    } catch {
      // Network error or token fully expired (refresh also failed)
      tokenStorage.clear();
      setAuthState({
        user: null,
        companies: [],
        isAuthenticated: false,
        loading: false,
        activeCompanyId: null,
      });
    }
  }, []);

  // ===== On mount: verify user session =====
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    if (authState.isAuthenticated && authState.loading) {
      fetchCurrentUser();
    }
  }, [authState.isAuthenticated, authState.loading, fetchCurrentUser]);

  // ===== Login =====
  const login = useCallback(async (emailOrNickname: string, password: string) => {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN,
      variables: { emailOrNickname, password },
    });

    const loginResult = (data as Record<string, unknown>)?.login as LoginResponse | undefined;

    if (loginResult?.success && loginResult.user && loginResult.tokens) {
      // Persist tokens and user
      tokenStorage.setTokens(loginResult.tokens.token || '', loginResult.tokens.refreshToken || '');
      tokenStorage.setUser(loginResult.user);

      // Set initial activeCompanyId from user or first company
      const initialCompanyId = loginResult.user.activeCompanyId || loginResult.companies?.[0]?.id || null;
      localStorage.setItem('fc_active_company', initialCompanyId || '');

      setAuthState({
        user: loginResult.user,
        companies: loginResult.companies || [],
        isAuthenticated: true,
        loading: false,
        activeCompanyId: initialCompanyId,
      });

      return loginResult;
    }

    throw new Error(loginResult?.message || 'Login failed');
  }, []);

  // ===== Logout =====
  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem('fc_active_company');
    setAuthState({
      user: null,
      companies: [],
      isAuthenticated: false,
      loading: false,
      activeCompanyId: null,
    });
  }, []);

  // ===== Select company =====
  const selectCompany = useCallback(async (companyId: string) => {
    const { data } = await apolloClient.mutate({
      mutation: SELECT_COMPANY,
      variables: { companyId },
    });

    const result = (data as Record<string, unknown>)?.setActiveCompany as MeResponse | undefined;
    if (result?.success && result.user) {
      localStorage.setItem('fc_active_company', companyId);
      tokenStorage.setUser(result.user);

      setAuthState((prev) => ({
        ...prev,
        user: result.user!,
        companies: result.companies || prev.companies,
        activeCompanyId: companyId,
      }));

      // Refetch all queries with the new company context
      await apolloClient.resetStore().catch(() => {});
    }
  }, []);

  // ===== switchCompanyContext: boss-only, updates backend and refreshes session =====
  const switchCompanyContext = useCallback(async (companyId: string, companyName?: string) => {
    try {
      // 1. Call UPDATE_USER mutation to persist the new activeCompanyId in the backend
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_USER,
        variables: {
          user: {
            id: authState.user?.id,
            email: authState.user?.email,
            nickname: authState.user?.nickname,
            activeCompanyId: companyId,
          },
        },
      });

      const result = (data as Record<string, unknown>)?.updateUser as { user?: User } | undefined;
      const updatedUser = result?.user;

      // 2. Update localStorage with the new user data (simulates session refresh)
      if (updatedUser) {
        tokenStorage.setUser(updatedUser);
      }

      // 3. Persist the new active company in localStorage for the Apollo auth link
      localStorage.setItem('fc_active_company', companyId);

      // 4. Update React state with the new user and activeCompanyId
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser || prev.user,
        activeCompanyId: companyId,
      }));

      // 5. Reset the Apollo cache to refetch all queries with the new x-company-id header
      try {
        await apolloClient.resetStore();
      } catch {
        // resetStore can throw if a query fails; safe to ignore here
      }
    } catch (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  }, [authState.user?.id, authState.user?.email, authState.user?.nickname]);

  // ===== Forgot password =====
  const forgotPassword = useCallback(async (email: string) => {
    const { data } = await apolloClient.mutate({
      mutation: FORGOT_PASSWORD,
      variables: { email },
    });

    const result = (data as Record<string, unknown>)?.forgotPassword as { message?: string } | undefined;
    return result?.message || 'Password reset email sent';
  }, []);

  // ===== Refresh user =====
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // ===== Context value =====
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    selectCompany,
    switchCompanyContext,
    forgotPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ===== Hook =====
export function useFitConnectAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFitConnectAuth must be used within FitConnectAuthProvider');
  }
  return context;
}
