"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/utils/utils";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/src/i18n/config";
import { setLocale } from "@/src/i18n/actions";
import { useLocale } from "./locale-provider";

/**
 * EN / বাংলা toggle. The cookie is written by a server action, so the next
 * render of the root layout already knows the language.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (locale: Locale) => {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5",
        pending && "opacity-60",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => choose(locale)}
            aria-pressed={active}
            className={cn(
              "cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
