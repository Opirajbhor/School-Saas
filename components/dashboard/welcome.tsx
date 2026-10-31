import { Button } from "@/components/ui/button";
import { InstituteOutput } from "@/src/validation/auth.zod";
import { Teacherlist } from "@/src/validation/teacher.zod";

import {
  BarChart3,
  PencilLine,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";

interface ProfileComponentProps {
  institute: InstituteOutput;
  teacher: Teacherlist | null;
  sessionYear?: string | null;
}

// Each action links to the route that performs it. They previously had no href
// or onClick, so the buttons looked interactive and did nothing.
const quickActions = [
  {
    label: "Add Student",
    href: "/dashboard/students/add-new",
    icon: Plus,
    primary: false,
  },
  {
    label: "Add Teacher",
    href: "/dashboard/teachers",
    icon: UserRound,
    primary: false,
  },
  {
    label: "Enter Marks",
    href: "/dashboard/exam/mark-input",
    icon: PencilLine,
    primary: false,
  },
  {
    label: "View Results",
    href: "/dashboard/results",
    icon: BarChart3,
    primary: true,
  },
];

export async function Welcome({
  institute,
  teacher,
  sessionYear,
}: ProfileComponentProps) {
  const { nameEnglish, eiin } = institute;

  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-4 py-2 lg:flex-row lg:items-center">
      <div className="flex flex-col">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Executive Console •{" "}
            <span className="font-semibold text-primary">
              Session {sessionYear ?? "—"}
            </span>
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {teacher ? `Welcome back, ${teacher.nameEnglish}` : "Welcome back"}
        </h1>

        <p className="flex flex-wrap items-center gap-x-2 pt-1 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{nameEnglish}</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            EIIN: {eiin}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? "default" : "outline"}
            size="lg"
            className="gap-1.5"
            asChild
          >
            <Link href={action.href}>
              <action.icon className="size-4" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
