import { Button } from "@/components/ui/button";
import { SCHOOL_NAME } from "@/lib/dashboard-data";
import {
  FileBarChart,
  GraduationCap,
  PencilLine,
  Plus,
  UserPlus,
} from "lucide-react";

const quickActions = [
  { label: "Add Student", icon: UserPlus, primary: true },
  { label: "Create Exam", icon: FileBarChart, primary: false },
  { label: "Enter Marks", icon: PencilLine, primary: false },
  { label: "Publish Result", icon: GraduationCap, primary: false },
];

export function Welcome() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Welcome back, Rania</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground text-balance">
          {SCHOOL_NAME}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here is what&apos;s happening across your school today — Spring
          Session 2026.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            {action.primary ? (
              <Plus className="size-4" />
            ) : (
              <action.icon className="size-4" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
