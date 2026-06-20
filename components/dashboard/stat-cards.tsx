import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { stats } from "@/lib/dashboard-data"
import { TrendingDown, TrendingUp } from "lucide-react"

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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
