import {
  createContext,
  useCallback,
  useState,
  useRef,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
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
   * For all roles: switches the active company context.
   * 1. Calls UPDATE_USER mutation to persist activeCompanyId in the backend.
   * 2. Updates localStorage fc_active_company so the Apollo auth link sends the new x-company-id header.
   * 3. Updates React state so the UI reflects the new company immediately.
   * 4. Calls apolloClient.resetStore() to refetch all active queries with the new header.
   */
  switchCompanyContext: (companyId: string, companyName?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===== Provider =====
export function FitConnectAuthProvider({ children }: { children: ReactNode }) {
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

  // ===== Fetch current user on mount =====
  const fetchCurrentUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data } = await apolloClient.query({ query: ME, fetchPolicy: 'network-only' });
      const meResult = (data as Record<string, unknown>)?.me as MeResponse | undefined;

      if (meResult?.success && meResult.user) {
        // Prefer the saved company ID from localStorage (user may have switched companies)
        const savedCompanyId = localStorage.getItem('fc_active_company');
        const finalCompanyId = savedCompanyId || meResult.user.activeCompanyId || meResult.companies?.[0]?.id || null;
        localStorage.setItem('fc_active_company', finalCompanyId || '');

        setAuthState({
          user: meResult.user,
          companies: meResult.companies || [],
          isAuthenticated: true,
          loading: false,
          activeCompanyId: finalCompanyId,
        });
        tokenStorage.setUser(meResult.user);
      } else {
        tokenStorage.clear();
        localStorage.removeItem('fc_active_company');
        setAuthState({
          user: null,
          companies: [],
          isAuthenticated: false,
          loading: false,
          activeCompanyId: null,
        });
      }
    } catch (err) {
      console.error('[FitConnectAuth] fetchCurrentUser error:', err);
      tokenStorage.clear();
      localStorage.removeItem('fc_active_company');
      setAuthState({
        user: null,
        companies: [],
        isAuthenticated: false,
        loading: false,
        activeCompanyId: null,
      });
    }
  }, []);

  // Run once on mount only
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      fetchCurrentUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Login =====
  const login = useCallback(async (emailOrNickname: string, password: string) => {
    try {
      console.log('[FitConnectAuth] Calling LOGIN mutation');
      const { data } = await apolloClient.mutate({
        mutation: LOGIN,
        variables: { emailOrNickname, password },
      });
      console.log('[FitConnectAuth] LOGIN response:', data);

      const loginResult = (data as Record<string, unknown>)?.login as LoginResponse | undefined;

      if (loginResult?.success && loginResult.user && loginResult.tokens) {
        tokenStorage.setTokens(loginResult.tokens.token || '', loginResult.tokens.refreshToken || '');
        tokenStorage.setUser(loginResult.user);
        const initialCompanyId = loginResult.user.activeCompanyId || loginResult.companies?.[0]?.id || null;
        localStorage.setItem('fc_active_company', initialCompanyId || '');
        setAuthState({
          user: loginResult.user,
          companies: loginResult.companies || [],
          isAuthenticated: true,
          loading: false,
          activeCompanyId: initialCompanyId,
        });
      }
      return loginResult || { success: false, message: 'Login failed', code: 'LOGIN_FAILED' };
    } catch (err) {
      console.error('[FitConnectAuth] LOGIN error:', err);
      throw err;
    }
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

  // ===== Select Company (for regular users via SELECT_COMPANY mutation) =====
  const selectCompany = useCallback(async (companyId: string) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: SELECT_COMPANY,
        variables: { companyId },
      });

      const result = (data as Record<string, unknown>)?.selectCompany as { success: boolean } | undefined;
      if (result?.success) {
        // 1. Update localStorage FIRST so authLink picks it up immediately
        localStorage.setItem('fc_active_company', companyId);
        // 2. Update React state
        setAuthState((prev) => ({
          ...prev,
          activeCompanyId: companyId,
          user: prev.user ? { ...prev.user, activeCompanyId: companyId } : prev.user,
        }));
        // 3. Refetch all active queries with the new x-company-id header
        await apolloClient.resetStore();
      }
    } catch (err) {
      console.error('[FitConnectAuth] selectCompany error:', err);
      throw err;
    }
  }, []);

  // ===== Switch Company Context =====
  // Works for all roles. The key steps are:
  //   1. Update localStorage BEFORE the mutation so authLink already sends the new x-company-id
  //   2. Call UPDATE_USER mutation with the correct variable name ($user, not $input)
  //   3. Update React state with the new activeCompanyId and updated user
  //   4. Call apolloClient.resetStore() to refetch all queries
  const switchCompanyContext = useCallback(async (companyId: string) => {
    console.log('[FitConnectAuth] switchCompanyContext → companyId:', companyId);

    // Step 1: Update localStorage immediately so the authLink sends the new x-company-id
    // on the UPDATE_USER request itself and all subsequent requests
    localStorage.setItem('fc_active_company', companyId);

    // Step 2: Update React state optimistically so the UI reflects the change immediately
    setAuthState((prev) => ({
      ...prev,
      activeCompanyId: companyId,
      user: prev.user ? { ...prev.user, activeCompanyId: companyId } : prev.user,
    }));

    try {
      // Step 3: Persist activeCompanyId in the backend via UPDATE_USER mutation
      // IMPORTANT: The mutation variable is named $user (not $input)
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_USER,
        variables: { user: { activeCompanyId: companyId } },
      });

      const updateResult = (data as Record<string, unknown>)?.updateUser as {
        success: boolean;
        user?: User;
      } | undefined;

      console.log('[FitConnectAuth] UPDATE_USER result:', updateResult);

      if (updateResult?.success && updateResult.user) {
        // Step 4: Sync the full updated user from backend into localStorage and state
        tokenStorage.setUser(updateResult.user);
        setAuthState((prev) => ({
          ...prev,
          user: updateResult.user!,
          activeCompanyId: companyId,
        }));
      }
      // If mutation failed or returned no user, the optimistic state is still correct

    } catch (err) {
      console.error('[FitConnectAuth] switchCompanyContext UPDATE_USER error:', err);
      // Don't revert — the localStorage and state are already updated optimistically.
      // The x-company-id header is correct. The backend update failed but the frontend
      // context is correct for this session.
    }

    // Step 5: Refetch all active queries with the new x-company-id header
    // Use clearStore + refetch pattern to avoid issues with resetStore
    try {
      await apolloClient.resetStore();
    } catch (err) {
      // resetStore can throw if a query fails — ignore, data will refetch on next render
      console.warn('[FitConnectAuth] resetStore warning:', err);
    }
  }, []);

  // ===== Forgot Password =====
  const forgotPassword = useCallback(async (email: string) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: FORGOT_PASSWORD,
        variables: { email },
      });

      const result = (data as Record<string, unknown>)?.forgotPassword as { success: boolean; message?: string } | undefined;
      return result?.message || 'Email enviado';
    } catch (err) {
      console.error('[FitConnectAuth] forgotPassword error:', err);
      throw err;
    }
  }, []);

  // ===== Refresh User =====
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

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
  if (!context) throw new Error('useFitConnectAuth must be used inside FitConnectAuthProvider');
  return context;
}
