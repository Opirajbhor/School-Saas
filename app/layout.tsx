import type { Metadata } from "next";
import {
  Source_Serif_4,
  JetBrains_Mono,
  Inter,
  Noto_Sans_Bengali,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/src/tanstackQuery/provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getI18n } from "@/src/i18n/server";

// design.md asks for Notion Sans, which is proprietary; Inter is its base
// family, so proportions and metrics transfer.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Inter has no Bengali glyphs, so the Bangla UI loads its own face
const fontBangla = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bangla",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Educare — School Management",
    template: "%s · Educare",
  },
  description:
    "School management for Bangladeshi schools — students, classes, exams and published results in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getI18n();

  return (
    <html
      lang={locale}
      className={cn(
        "h-full",
        "antialiased",
        fontSerif.variable,
        fontMono.variable,
        fontBangla.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system">
          <LocaleProvider locale={locale} t={t}>
            <QueryProvider>{children}</QueryProvider>
          </LocaleProvider>
        </ThemeProvider>

        <Toaster />
      </body>
    </html>
  );
}
