import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apolloClient, tokenStorage } from '../graphql/apollo-client';
import { LOGIN, ME, SELECT_COMPANY, FORGOT_PASSWORD } from '../graphql/operations';
import type { User, Company, LoginResponse, MeResponse } from '../graphql/types';

interface AuthState {
  user: User | null;
  companies: Company[];
  isAuthenticated: boolean;
  loading: boolean;
  activeCompanyId: string | null;
}

interface AuthContextType extends AuthState {
  login: (emailOrNickname: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  selectCompany: (companyId: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function FitConnectAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    companies: [],
    isAuthenticated: false,
    loading: true,
    activeCompanyId: localStorage.getItem('fc_active_company'),
  });

  // Fetch current user from the backend using the ME query
  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: ME,
        fetchPolicy: 'network-only',
      });
      const meData = (data as Record<string, unknown>)?.me as MeResponse | undefined;
      if (meData?.success && meData.user) {
        setAuthState({
          user: meData.user,
          companies: meData.companies || [],
          isAuthenticated: true,
          loading: false,
          activeCompanyId:
            meData.user.activeCompanyId || localStorage.getItem('fc_active_company'),
        });
      } else {
        tokenStorage.clear();
        setAuthState((prev) => ({ ...prev, loading: false, isAuthenticated: false }));
      }
    } catch {
      tokenStorage.clear();
      setAuthState((prev) => ({ ...prev, loading: false, isAuthenticated: false }));
    }
  }, []);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      fetchCurrentUser();
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (emailOrNickname: string, password: string): Promise<LoginResponse> => {
      const { data } = await apolloClient.query({
        query: LOGIN,
        variables: { emailOrNickname, password },
        fetchPolicy: 'network-only',
      });

      const loginData = (data as Record<string, unknown>)?.login as LoginResponse;

      if (loginData?.success && loginData.tokens?.token) {
        tokenStorage.setTokens(
          loginData.tokens.token,
          loginData.tokens.refreshToken || ''
        );

        const user = loginData.user!;
        const companies = loginData.companies || [];

        if (user.activeCompanyId) {
          localStorage.setItem('fc_active_company', user.activeCompanyId);
        }

        setAuthState({
          user,
          companies,
          isAuthenticated: true,
          loading: false,
          activeCompanyId: user.activeCompanyId || null,
        });
      }

      return loginData;
    },
    []
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    apolloClient.clearStore();
    setAuthState({
      user: null,
      companies: [],
      isAuthenticated: false,
      loading: false,
      activeCompanyId: null,
    });
  }, []);

  const selectCompany = useCallback(async (companyId: string) => {
    const { data } = await apolloClient.mutate({
      mutation: SELECT_COMPANY,
      variables: { companyId },
    });

    const result = (data as Record<string, unknown>)?.setActiveCompany as MeResponse | undefined;
    if (result?.success && result.user) {
      localStorage.setItem('fc_active_company', companyId);
      setAuthState((prev) => ({
        ...prev,
        user: result.user!,
        companies: result.companies || prev.companies,
        activeCompanyId: companyId,
      }));
      await apolloClient.resetStore();
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const { data } = await apolloClient.mutate({
      mutation: FORGOT_PASSWORD,
      variables: { email },
    });
    return (data as Record<string, unknown>)?.forgotPassword as string || '';
  }, []);

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

export function useFitConnectAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFitConnectAuth must be used within a FitConnectAuthProvider');
  }
  return context;
}
