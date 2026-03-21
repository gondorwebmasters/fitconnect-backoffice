import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { REFRESH_ACCESS_TOKEN } from './operations';

const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

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
};

// ===== HTTP Link =====
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

// ===== Auth Link: attach Bearer token to every request =====
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

// ===== Token refresh logic =====
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((cb) => cb());
  pendingRequests = [];
};

/**
 * Error link using Apollo Client v4 API.
 * The handler receives { error, operation, forward } where `error` is an
 * ErrorLike object. We use CombinedGraphQLErrors.is() to detect GraphQL errors.
 */
const errorLink = onError(({ error, operation, forward }) => {
  // Handle GraphQL errors (e.g. UNAUTHENTICATED)
  if (CombinedGraphQLErrors.is(error)) {
    const hasAuthError = error.errors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message?.toLowerCase().includes('not authenticated') ||
        err.message?.toLowerCase().includes('token expired') ||
        err.message?.toLowerCase().includes('jwt expired')
    );

    if (hasAuthError) {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = '/login';
        return;
      }

      if (!isRefreshing) {
        isRefreshing = true;

        apolloClient
          .mutate({
            mutation: REFRESH_ACCESS_TOKEN,
            variables: { inputToken: refreshToken },
          })
          .then((response) => {
            const data = response.data as Record<string, unknown> | null;
            const result = data?.refreshAccessToken as
              | { tokens?: { token?: string; refreshToken?: string } }
              | undefined;
            const tokens = result?.tokens;
            if (tokens?.token && tokens?.refreshToken) {
              tokenStorage.setTokens(tokens.token, tokens.refreshToken);
              resolvePendingRequests();
            } else {
              tokenStorage.clear();
              window.location.href = '/login';
            }
          })
          .catch(() => {
            tokenStorage.clear();
            pendingRequests = [];
            window.location.href = '/login';
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return new Observable((observer) => {
        pendingRequests.push(() => {
          const subscriber = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
          return () => subscriber.unsubscribe();
        });
      });
    }
  }

  // Log network errors
  if (error && !CombinedGraphQLErrors.is(error)) {
    console.error(`[Network error]:`, error);
  }
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
