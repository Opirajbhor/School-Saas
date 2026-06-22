import { ClassesTable } from "@/components/classes/classes-table"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { classStats } from "@/lib/classes-data"
import { Download, Plus } from "lucide-react"

export const metadata = {
  title: "Classes — Scholarly",
  description: "Manage classes, sections, class teachers, and enrollment across all levels.",
}

export default function ClassesPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Classes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage classes, sections, and class teachers across all academic levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="size-4" />
            New Class
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {classStats.map((stat) => (
          <Card key={stat.label} className="gap-0 p-5">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <ClassesTable />
    </DashboardShell>
  )
}
