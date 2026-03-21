import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient, tokenStorage } from '../graphql/apollo-client';
import { LOGIN, ME, SELECT_COMPANY, FORGOT_PASSWORD } from '../graphql/operations';
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
  selectCompany: (companyId: string) => Promise<void>;
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

        setAuthState({
          user: meData.user,
          companies: meData.companies || [],
          isAuthenticated: true,
          loading: false,
          activeCompanyId:
            meData.user.activeCompanyId || localStorage.getItem('fc_active_company'),
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

  // ===== Session restoration on mount =====
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    const token = tokenStorage.getAccessToken();
    if (token) {
      // Verify the token against the backend
      fetchCurrentUser();
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, [fetchCurrentUser]);

  // ===== Login =====
  const login = useCallback(
    async (emailOrNickname: string, password: string): Promise<LoginResponse> => {
      const { data } = await apolloClient.query({
        query: LOGIN,
        variables: { emailOrNickname, password },
        fetchPolicy: 'network-only',
      });

      const loginData = (data as Record<string, unknown>)?.login as LoginResponse;

      if (loginData?.success && loginData.tokens?.token) {
        // Store tokens
        tokenStorage.setTokens(
          loginData.tokens.token,
          loginData.tokens.refreshToken || ''
        );

        const user = loginData.user!;
        const companies = loginData.companies || [];

        // Persist user for session restoration
        tokenStorage.setUser(user);

        // Store active company if available
        if (user.activeCompanyId) {
          localStorage.setItem('fc_active_company', user.activeCompanyId);
        } else if (companies.length === 1) {
          // Auto-select if only one company
          localStorage.setItem('fc_active_company', companies[0].id);
        }

        setAuthState({
          user,
          companies,
          isAuthenticated: true,
          loading: false,
          activeCompanyId:
            user.activeCompanyId || (companies.length === 1 ? companies[0].id : null),
        });
      }

      return loginData;
    },
    []
  );

  // ===== Logout: clear everything and reset Apollo cache =====
  const logout = useCallback(() => {
    // Clear all stored data
    tokenStorage.clear();

    // Reset Apollo cache to prevent stale data leaking to next session
    apolloClient.clearStore().catch(() => {
      // If clearStore fails, force reset
      apolloClient.resetStore().catch(() => {});
    });

    // Reset auth state
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

  // ===== Forgot password =====
  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const { data } = await apolloClient.mutate({
      mutation: FORGOT_PASSWORD,
      variables: { email },
    });
    return ((data as Record<string, unknown>)?.forgotPassword as string) || '';
  }, []);

  // ===== Refresh user data =====
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        selectCompany,
        forgotPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===== Hook =====
export function useFitConnectAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFitConnectAuth must be used within a FitConnectAuthProvider');
  }
  return context;
}
