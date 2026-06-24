import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { activities } from "@/src/lib/dashboard-data"
import { cn } from "@/src/lib/utils"
import { ClipboardList, GraduationCap, PencilLine, UserPlus } from "lucide-react"

const kindIcon = {
  result: GraduationCap,
  exam: ClipboardList,
  marks: PencilLine,
  student: UserPlus,
} as const

const kindStyle = {
  result: "bg-chart-3/10 text-chart-3",
  exam: "bg-primary/10 text-primary",
  marks: "bg-chart-4/15 text-chart-4",
  student: "bg-chart-2/15 text-chart-2",
} as const

export function ActivityFeed() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ol className="relative flex flex-col gap-5">
          {activities.map((activity) => {
            const Icon = kindIcon[activity.kind]
            return (
              <li key={activity.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    kindStyle[activity.kind],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    <span className="font-medium">{activity.actor}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
