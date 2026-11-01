import Link from "next/link";
import { SealCheck as BadgeCheck, SealCheck as ClipboardCheck, Table as FileSpreadsheet, Buildings as Building2, GraduationCap, Books as BookOpen, Lock, TreeStructure as Layers, ArrowRight, CheckCircle as CheckCircle2 } from "@phosphor-icons/react/ssr";


import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Building2,
    title: "One record per institute",
    body: "Every school is keyed to its EIIN, with division, district and upazila from the Bangladesh board data.",
  },
  {
    icon: Layers,
    title: "Classes, sections and groups",
    body: "Classes and groups are platform defaults; each institute creates its own sections and assigns teachers to them.",
  },
  {
    icon: BookOpen,
    title: "Subject assignment per class",
    body: "Mark a subject compulsory, optional, religious or group-based for each class — not globally.",
  },
  {
    icon: ClipboardCheck,
    title: "Mark entry with a workflow",
    body: "Teachers enter paper by paper. Edits go through a request queue, then the admin finalizes and publishes.",
  },
  {
    icon: FileSpreadsheet,
    title: "GPA on your own scale",
    body: "Results are computed from the grade bands your institute sets — A+ to F, with the GPA points you define.",
  },
  {
    icon: Lock,
    title: "Published results stay fixed",
    body: "Publishing takes a snapshot, so a later correction never silently rewrites a result a parent already saw.",
  },
];

const steps = [
  {
    title: "Create your account",
    body: "Email and password, then the institute profile: EIIN, both names, phone and location.",
  },
  {
    title: "Set up the year",
    body: "An admin profile, your sections, subject assignment per class and the teaching staff.",
  },
  {
    title: "Enter marks and publish",
    body: "Open an exam, enter marks per paper, clear the edit requests and publish the GPA results.",
  },
];

const localDetails = [
  "EIIN-based institute records",
  "Division, district and upazila pickers",
  "Bangla and English institute and student names",
  "Combined papers (Bangla 1st & 2nd, English 1st & 2nd)",
  "GPA-5 grade bands you control",
  "Marks entered per CQ / MCQ / practical component",
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* hero */}
      <section className="relative overflow-hidden px-5 pt-28 pb-16 sm:px-8 lg:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" />
            Built for Bangladeshi schools
          </span>

          <h1 className="mt-5 font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Run the whole school
            <br className="hidden sm:block" /> from one place.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Students, classes, teachers, exams and GPA results — with the mark
            entry workflow and EIIN records a Bangladeshi school actually needs.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/onboarding/signup">
                Set up your school
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No card needed · one institute per account
          </p>
        </div>
      </section>

      {/* features */}
      <section id="features" className="border-t px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Everything the office keeps in a register
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Not a generic admin template with school labels — the records,
              rules and outputs follow how a Bangladeshi secondary school works.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-t bg-muted/30 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Three steps to a published result
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-xl border bg-card p-5">
                <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* local detail */}
      <section id="why" className="border-t px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Local details are not an afterthought
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              The parts that make a school management system usable here are the
              ones a foreign template never has.
            </p>

            <Button asChild className="mt-6" variant="outline">
              <Link href="/auth/onboarding/signup">
                Create an institute
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {localDetails.map((detail) => (
              <li
                key={detail}
                className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* closing CTA */}
      <section className="border-t px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-2xl border bg-foreground px-6 py-12 text-center text-background">
          <GraduationCap className="size-8 text-primary" />
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Start with your institute profile
          </h2>
          <p className="max-w-md text-sm text-background/70">
            EIIN, names and location first — then classes, staff and results.
            Everything stays inside your institute.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/onboarding/signup">
                Create account
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            Educare · school management for Bangladesh
          </span>

          <span className="flex items-center gap-4">
            <Link href="#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="#how" className="hover:text-foreground">
              How it works
            </Link>
            <Link href="/auth/login" className="hover:text-foreground">
              Sign in
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
