import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { recentResults } from "@/src/lib/dashboard-data"
import { cn } from "@/src/lib/utils"

const statusStyle = {
  Published: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  Pending: "border-chart-4/25 bg-chart-4/15 text-chart-4",
  Reviewing: "border-primary/20 bg-primary/10 text-primary",
} as const

export function ResultsTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Published Results</CardTitle>
        <Button variant="outline" size="sm">
          View all
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Result ID</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Subjects</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Avg</TableHead>
                <TableHead className="text-center">Pass</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentResults.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                    {row.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{row.exam}</TableCell>
                  <TableCell className="text-muted-foreground">{row.classroom}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.subjects}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.students}</TableCell>
                  <TableCell className="text-center font-medium text-foreground">{row.avg}</TableCell>
                  <TableCell className="text-center font-medium text-foreground">{row.pass}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", statusStyle[row.status])}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
