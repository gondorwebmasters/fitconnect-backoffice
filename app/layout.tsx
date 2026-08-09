import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast";
import { ApolloWrapper } from "@/lib/apollo/wrapper";
import { LocalizationProvider } from "@/theme/localization-provider";
import { ThemeProvider } from "@/theme/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitConnect · Backoffice",
  description: "Panel de administración de FitConnect",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={jakarta.variable}>
      <body>
        <InitColorSchemeScript modeStorageKey="fc-bo-mode" defaultMode="system" />
        <AppRouterCacheProvider options={{ key: "css" }}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LocalizationProvider>
              <ThemeProvider>
                <ApolloWrapper>
                  <ToastProvider>{children}</ToastProvider>
                </ApolloWrapper>
              </ThemeProvider>
            </LocalizationProvider>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
