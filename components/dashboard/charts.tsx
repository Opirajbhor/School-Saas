import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ClassDistributionRow } from "@/app/dashboard/_actions/dashboard.action";

// Horizontal bar lists rather than a chart library: every value is a real
// per-class count, and the bars scale against the largest cohort so a small
// institute still reads clearly. Replaces two charts whose data was invented.
function BarRow({
  label,
  value,
  unit,
  percent,
  barClassName,
}: {
  label: string;
  value: number;
  unit: string;
  percent: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 font-mono text-sm font-semibold text-primary tabular-nums">
          {value.toLocaleString("en-US")}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ClassDistributionChart({
  data,
}: {
  data: ClassDistributionRow[];
}) {
  const max = Math.max(...data.map((row) => row.students), 1);
  const total = data.reduce((sum, row) => sum + row.students, 0);
  const average = data.length ? Math.round(total / data.length) : 0;
  const highest = data.reduce<ClassDistributionRow | null>(
    (top, row) => (top === null || row.students > top.students ? row : top),
    null,
  );

  return (
    <Card className="flex flex-col justify-between gap-0">
      <div>
        <CardHeader className="gap-1 border-b pb-3">
          <h2 className="font-heading font-semibold text-foreground">
            Students per Class
          </h2>
          <p className="text-sm text-muted-foreground">
            Enrolment breakdown (Total: {total.toLocaleString("en-US")})
          </p>
        </CardHeader>

        {data.length === 0 ? (
          <EmptyChart message="No classes yet. Add a class to see its enrolment." />
        ) : (
          <CardContent className="space-y-3 pt-4">
            {data.map((row) => (
              <BarRow
                key={row.classId}
                label={row.className}
                value={row.students}
                unit="students"
                percent={Math.round((row.students / max) * 100)}
                barClassName="bg-primary"
              />
            ))}
          </CardContent>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Highest cohort: {highest?.className ?? "—"} ({highest?.students ?? 0})
          </span>
          <span>Average / class: {average} students</span>
        </div>
      )}
    </Card>
  );
}

export function SubjectWorkloadChart({
  data,
}: {
  data: ClassDistributionRow[];
}) {
  const rows = data.filter((row) => row.subjects > 0);
  const max = Math.max(...rows.map((row) => row.subjects), 1);
  const highest = rows.reduce<ClassDistributionRow | null>(
    (top, row) => (top === null || row.subjects > top.subjects ? row : top),
    null,
  );

  return (
    <Card className="flex flex-col justify-between gap-0">
      <div>
        <CardHeader className="gap-1 border-b pb-3">
          <h2 className="font-heading font-semibold text-foreground">
            Subjects Assigned per Class
          </h2>
          <p className="text-sm text-muted-foreground">
            Curricular workload configured in the syllabus
          </p>
        </CardHeader>

        {rows.length === 0 ? (
          <EmptyChart message="No subjects assigned yet. Assign subjects to a class to see the workload." />
        ) : (
          <CardContent className="space-y-3 pt-4">
            {rows.map((row) => (
              <BarRow
                key={row.classId}
                label={row.className}
                value={row.subjects}
                unit={row.subjects === 1 ? "subject" : "subjects"}
                percent={Math.round((row.subjects / max) * 100)}
                barClassName="bg-chart-3"
              />
            ))}
          </CardContent>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Curriculum split: General &amp; Group electives</span>
          <span>
            Most: {highest?.className ?? "—"} ({highest?.subjects ?? 0})
          </span>
        </div>
      )}
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <CardContent className="pt-4">
      <div className="flex h-[248px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <p className="px-6 text-center text-sm text-muted-foreground">{message}</p>
      </div>
    </CardContent>
  );
}
