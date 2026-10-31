import type { Metadata } from "next";
import { Source_Serif_4, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/src/tanstackQuery/provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Educare — School Management",
    template: "%s · Educare",
  },
  description:
    "School management for Bangladeshi schools — students, classes, exams and published results in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        fontSerif.variable,
        fontMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system">
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>

        <Toaster />
      </body>
    </html>
  );
}
