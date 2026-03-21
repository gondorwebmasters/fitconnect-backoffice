import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { REFRESH_ACCESS_TOKEN } from './operations';

const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_FITCONNECT_API_URL || 'http://localhost:4000/graphql';

// ===== Token helpers =====
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('fc_access_token'),
  getRefreshToken: () => localStorage.getItem('fc_refresh_token'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('fc_access_token', access);
    localStorage.setItem('fc_refresh_token', refresh);
  },
  clear: () => {
    localStorage.removeItem('fc_access_token');
    localStorage.removeItem('fc_refresh_token');
    localStorage.removeItem('fc_active_company');
    localStorage.removeItem('fc_user');
  },
  /** Persist user JSON for session restoration without a network call */
  setUser: (user: unknown) => {
    try {
      localStorage.setItem('fc_user', JSON.stringify(user));
    } catch { /* quota exceeded — ignore */ }
  },
  getUser: <T = unknown>(): T | null => {
    try {
      const raw = localStorage.getItem('fc_user');
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
};

// ===== HTTP Link =====
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

// ===== Auth Link: attach Bearer token + company header to every request =====
const authLink = new ApolloLink((operation, forward) => {
  const token = tokenStorage.getAccessToken();
  const companyId = localStorage.getItem('fc_active_company');

  operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { 'x-company-id': companyId } : {}),
    },
  }));

  return forward(operation);
});

// ===== Token refresh queue =====
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: () => void;
  reject: (reason?: unknown) => void;
}> = [];

function resolvePendingRequests() {
  pendingRequests.forEach(({ resolve }) => resolve());
  pendingRequests = [];
}

function rejectPendingRequests(reason?: unknown) {
  pendingRequests.forEach(({ reject }) => reject(reason));
  pendingRequests = [];
}

/** Perform the token refresh mutation using a bare HttpLink to avoid infinite loops */
async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await apolloClient.mutate({
      mutation: REFRESH_ACCESS_TOKEN,
      variables: { inputToken: refreshToken },
      // Skip the error link for this request to avoid infinite recursion
      context: { skipErrorLink: true },
    });

    const data = response.data as Record<string, unknown> | null;
    const result = data?.refreshAccessToken as
      | { success?: boolean; tokens?: { token?: string; refreshToken?: string } }
      | undefined;

    if (result?.tokens?.token && result?.tokens?.refreshToken) {
      tokenStorage.setTokens(result.tokens.token, result.tokens.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function forceLogout() {
  tokenStorage.clear();
  // Only redirect if not already on login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// ===== Error Link: handle auth errors with automatic token refresh =====
const errorLink = onError((errorHandler) => {
  const { operation, forward } = errorHandler;
  // Access the raw error object — Apollo v4 passes it differently
  const errorObj = errorHandler as unknown as Record<string, unknown>;

  // Skip error handling for refresh token requests to avoid infinite loops
  if (operation.getContext().skipErrorLink) return;

  // Detect authentication errors from GraphQL response or network layer
  let hasAuthError = false;

  // Check graphQLErrors array (standard Apollo v3/v4 shape)
  const graphQLErrors = errorObj.graphQLErrors as Array<{
    message?: string;
    extensions?: { code?: string };
  }> | undefined;

  if (graphQLErrors?.length) {
    hasAuthError = graphQLErrors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message?.toLowerCase().includes('not authenticated') ||
        err.message?.toLowerCase().includes('token expired') ||
        err.message?.toLowerCase().includes('jwt expired') ||
        err.message?.toLowerCase().includes('invalid token') ||
        err.message?.toLowerCase().includes('jwt must be provided')
    );
  }

  // Also check the combined error object
  const combinedError = errorObj.error as { errors?: Array<{ message?: string; extensions?: { code?: string } }> } | undefined;
  if (!hasAuthError && combinedError?.errors?.length) {
    hasAuthError = combinedError.errors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message?.toLowerCase().includes('not authenticated') ||
        err.message?.toLowerCase().includes('token expired') ||
        err.message?.toLowerCase().includes('jwt expired') ||
        err.message?.toLowerCase().includes('invalid token') ||
        err.message?.toLowerCase().includes('jwt must be provided')
    );
  }

  if (!hasAuthError) {
    // Log network errors for debugging
    const networkError = errorObj.networkError as Error | undefined;
    if (networkError) {
      console.error('[Network error]:', networkError.message);
    }
    return;
  }

  // --- Auth error detected: attempt token refresh ---
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    forceLogout();
    return;
  }

  if (!isRefreshing) {
    isRefreshing = true;

    performTokenRefresh()
      .then((success) => {
        if (success) {
          resolvePendingRequests();
        } else {
          rejectPendingRequests(new Error('Token refresh failed'));
          forceLogout();
        }
      })
      .catch((err) => {
        rejectPendingRequests(err);
        forceLogout();
      })
      .finally(() => {
        isRefreshing = false;
      });
  }

  // Queue this failed request to retry after the refresh completes
  return new Observable((observer) => {
    const entry = {
      resolve: () => {
        // Retry the original operation with the new token
        const subscriber = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
        return () => subscriber.unsubscribe();
      },
      reject: (reason?: unknown) => {
        observer.error(reason);
      },
    };
    pendingRequests.push(entry);
  });
});

// ===== Apollo Client instance =====
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getUsers: { merge: true },
          getProducts: { merge: true },
          getSchedules: { merge: true },
          listPlans: { merge: true },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
