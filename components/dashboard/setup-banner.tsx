import { cn } from "@/src/lib/utils";
import { CircleCheck, Loader } from "lucide-react";
import Link from "next/link";
import type { SetupSummary } from "@/app/dashboard/_actions/dashboard.action";

// Each step is derived from a live count, not a stored flag, so the banner
// cannot claim setup is done when the data says otherwise.
export function SetupBanner({ setup }: { setup?: SetupSummary }) {
  const steps = [
    {
      label: "Class setup",
      done: setup?.hasClasses ?? false,
      href: "/dashboard/classes",
    },
    {
      label: "Teacher assignments",
      done: setup?.hasTeacherAssignments ?? false,
      href: "/dashboard/teacher-assignment",
    },
    {
      label: "Mark entry",
      done: (setup?.examsOpen ?? 0) > 0,
      href: "/dashboard/exam/mark-input",
    },
  ];

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm shadow-xs md:flex-row md:items-center">
      <div className="flex items-center gap-2">
        <CircleCheck className="size-5 shrink-0 text-primary" />
        <div>
          <span className="font-semibold text-primary">
            {setup?.sessionYear
              ? `Active Academic Year: ${setup.sessionYear}.`
              : "No active academic session."}
          </span>
          <span className="ml-1 text-muted-foreground">
            {setup?.sessionYear ? "Quick steps: " : "Start by creating a session."}
          </span>
          {setup?.sessionYear &&
            steps.map((step, index) => (
              <span key={step.label} className="text-muted-foreground">
                <Link
                  href={step.href}
                  className={cn(
                    "hover:underline",
                    step.done ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  {step.label} {step.done ? "✓" : "·"}
                </Link>
                {index < steps.length - 1 && " · "}
              </span>
            ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard/academic-sessions"
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          Manage Session
        </Link>
        {(setup?.examsOpen ?? 0) > 0 && (
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Loader className="size-3" />
            {setup?.examsOpen} in progress
          </span>
        )}
      </div>
    </div>
  );
}
