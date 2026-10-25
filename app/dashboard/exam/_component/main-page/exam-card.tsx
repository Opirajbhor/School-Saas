import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Calendar, ClipboardList } from "lucide-react";
import { OutputExamType } from "../../_schema/exam.zod";

// --- Reusable Exam Card Component ---
const progressPercentage = Math.floor(Math.random() * 100);
export function ExamCard({ exam }: { exam: OutputExamType }) {
  // Math.round((exam.progress / exam.totalClasses) * 100) || 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      {/* Top Row: Icon, Title, Status */}
      <CardHeader>
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg `}
          >
            <ClipboardList size={20} />
          </div>
          <CardTitle className="leading-tight">{exam.name}</CardTitle>
        </div>
        <CardAction>
          <StatusBadge status={exam.status} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Dates */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar size={14} className="text-muted-foreground" />
          <span>{/* {exam.dateStart} - {exam.dateEnd} */}</span>
        </div>

        {/* Assigned Classes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Assigned Classes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {exam.assignClasses.map((cls) => (
              <Badge key={cls.class.id} variant="secondary">
                {cls.class.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Mark Entry Progress
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-[11px] font-medium text-muted-foreground">
                {/* {exam.progress} of {exam.totalClasses} classes completed */}
              </p>
            </div>

            {/* Action Button */}
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Reusable Status Badge ---
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    Active: "default",
    Upcoming: "outline",
    Completed: "secondary",
    Inactive: "secondary",
  };

  return (
    <Badge
      variant={variants[status] || "secondary"}
      className="h-auto px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
    >
      {status}
    </Badge>
  );
}
