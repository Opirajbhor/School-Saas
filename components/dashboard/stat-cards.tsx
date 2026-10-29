import { Card } from "@/components/ui/card"
import { cn } from "@/src/lib/utils"
import { stats } from "@/src/lib/dashboard-data"
import { TrendingDown, TrendingUp } from "lucide-react"

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-0 p-5">
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {stat.value}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                stat.trend === "up"
                  ? "bg-chart-3/10 text-chart-3"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {stat.trend === "up" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {stat.delta}
            </span>
            <span className="text-xs text-muted-foreground">{stat.hint}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Real counts for one institute, passed in so the caller owns the query.
export type StudentStats = {
  total: number;
  active: number;
  inactive: number;
  classes: number;
  sections: number;
};

export function StudentStatCards({ stats }: { stats: StudentStats }) {
  const cards = [
    { label: "Total Students", value: stats.total, hint: "all enrollments" },
    { label: "Active", value: stats.active, hint: "currently enrolled" },
    { label: "Inactive", value: stats.inactive, hint: "no longer enrolled" },
    { label: "Classes", value: stats.classes, hint: "with students" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-0 p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {card.value}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{card.hint}</p>
        </Card>
      ))}
    </div>
  );
}
