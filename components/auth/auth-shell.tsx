import Link from "next/link";
import { GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";

/**
 * Split auth screen: a brand panel on the left (TailAdmin-style) and the form
 * column on the right. Colours come from the app palette, not from TailAdmin.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-foreground px-12 py-10 text-background lg:flex lg:flex-col">
        {/* soft brand glow, purely decorative */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-primary/25 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Educare</span>
        </Link>

        <div className="relative mt-auto space-y-6">
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            Marks, GPA and student records in one place.
          </h1>

          <ul className="space-y-3 text-sm text-background/70">
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              EIIN-scoped records, kept separate for every institute.
            </li>
            <li className="flex gap-2.5">
              <Users className="mt-0.5 size-4 shrink-0 text-primary" />
              Classes, sections and groups for the Bangladesh curriculum.
            </li>
            <li className="flex gap-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              GPA results computed from your institute&apos;s own grade scale.
            </li>
          </ul>

          <p className="text-xs text-background/40">
            Educare · school management for Bangladesh
          </p>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
            aria-label="Educare home"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Educare
            </span>
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
}
