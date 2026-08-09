import { cookies } from "next/headers";

import { COMPANY_COOKIE, REFRESH_COOKIE, SUPERADMIN_COOKIE, TOKEN_COOKIE } from "./constants";
import {CONFIG} from "@/config-global";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function graphqlUrl(): string {
  return CONFIG.site.serverUrl ?? "http://localhost:4000/graphql";
}

export async function setAuthCookies(token: string, refreshToken: string, isSuperAdmin?: boolean) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 7 });
  store.set(REFRESH_COOKIE, refreshToken, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 });
  if (isSuperAdmin !== undefined) {
    store.set(SUPERADMIN_COOKIE, isSuperAdmin ? "1" : "0", {
      ...COOKIE_BASE,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function setActiveCompanyCookie(companyId: string) {
  const store = await cookies();
  store.set(COMPANY_COOKIE, companyId, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(SUPERADMIN_COOKIE);
  store.delete(COMPANY_COOKIE);
}

export async function getActiveCompanyId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COMPANY_COOKIE)?.value;
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

/** Llamada GraphQL directa server-to-server (route handlers). */
export async function gqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<{ data?: T; errors?: { message: string; extensions?: { code?: string } }[] }> {
  const res = await fetch(graphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}
