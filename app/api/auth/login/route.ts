import { NextResponse } from "next/server";

import { gqlRequest, setActiveCompanyCookie, setAuthCookies } from "@/lib/auth";

const LOGIN_QUERY = /* GraphQL */ `
  query Login($emailOrNickname: String!, $password: String!) {
    login(emailOrNickname: $emailOrNickname, password: $password) {
      success
      message
      user {
        id
        name
        surname
        email
        nickname
        contextRole
        isSuperAdmin
        activeCompanyId
      }
      companies {
        id
        name
      }
      tokens {
        token
        refreshToken
      }
    }
  }
`;

type LoginData = {
  login: {
    success: boolean;
    message: string;
    user: {
      id: string;
      contextRole: string | null;
      isSuperAdmin: boolean | null;
      activeCompanyId: string | null;
    } | null;
    companies: { id: string; name: string }[] | null;
    tokens: { token: string | null; refreshToken: string | null } | null;
  };
};

export async function POST(request: Request) {
  const { emailOrNickname, password } = await request.json();

  if (!emailOrNickname || !password) {
    return NextResponse.json({ success: false, message: "Credenciales incompletas" }, { status: 400 });
  }

  const normalizedEmailOrNickname = String(emailOrNickname).trim().toLowerCase();

  const { data, errors } = await gqlRequest<LoginData>(LOGIN_QUERY, {
    emailOrNickname: normalizedEmailOrNickname,
    password,
  });

  if (errors?.length || !data?.login?.success) {
    return NextResponse.json(
      { success: false, message: data?.login?.message ?? errors?.[0]?.message ?? "Error de autenticación" },
      { status: 401 },
    );
  }

  const { user, tokens, companies } = data.login;

  if (!tokens?.token || !tokens.refreshToken || !user) {
    return NextResponse.json({ success: false, message: "Respuesta de login incompleta" }, { status: 401 });
  }

  const isSuperAdmin = Boolean(user.isSuperAdmin);
  if (!isSuperAdmin && user.contextRole !== "admin") {
    return NextResponse.json(
      { success: false, message: "Acceso restringido a administradores" },
      { status: 403 },
    );
  }

  await setAuthCookies(tokens.token, tokens.refreshToken, isSuperAdmin);
  if (user.activeCompanyId) {
    await setActiveCompanyCookie(user.activeCompanyId);
  }

  return NextResponse.json({ success: true, user, companies });
}
