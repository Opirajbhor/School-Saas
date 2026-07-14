
import { Card, CardContent } from "@/components/ui/card";
import { TeacherStatsResponse } from "@/src/validation/teacher.zod";

export default function TeacherStats({
  stats,
}: {
  stats: TeacherStatsResponse;
}) {
  if (!stats.success || !stats.data) {
    return <h1>error</h1>;
  }
  const { totalTeachers, activeTeachers, maleTeachers, femaleTeachers } =
    stats?.data;

  const items = [
    {
      title: "Total Teachers",
      value: totalTeachers,
    },
    {
      title: "Active",
      value: activeTeachers,
    },
    {
      title: "Male Teachers",
      value: maleTeachers,
    },
    {
      title: "Female Teachers",
      value: femaleTeachers,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{item.title}</p>

            <h2 className="mt-2 text-3xl font-bold">{item.value}</h2>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
