"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/src/lib/utils"
import { classes, type ClassRow } from "@/lib/classes-data"
import { MoreHorizontal, Search } from "lucide-react"
import { useMemo, useState } from "react"

const filters = ["All Levels", "Senior Secondary", "Secondary", "Middle School"]

export function ClassesTable() {
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("All Levels")

  const rows = useMemo(() => {
    return classes.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.classTeacher.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
      const matchesLevel = level === "All Levels" || c.level === level
      return matchesQuery && matchesLevel
    })
  }, [query, level])

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes or teachers..."
            className="h-9 border-border bg-secondary/60 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={level === f ? "default" : "outline"}
              onClick={() => setLevel(f)}
              className="h-8 text-xs"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Class</TableHead>
              <TableHead>Class Teacher</TableHead>
              <TableHead className="text-center">Sections</TableHead>
              <TableHead className="text-center">Subjects</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <ClassTableRow key={c.id} c={c} />
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No classes match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Showing {rows.length} of {classes.length} classes
        </span>
      </div>
    </Card>
  )
}

function ClassTableRow({ c }: { c: ClassRow }) {
  const fillPct = Math.round((c.students / c.capacity) * 100)

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{c.name}</span>
          <span className="text-xs text-muted-foreground">
            {c.id} · {c.level}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-accent text-[11px] font-semibold text-accent-foreground">
              {c.teacherInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground">{c.classTeacher}</span>
        </div>
      </TableCell>
      <TableCell className="text-center text-sm text-foreground">{c.sections}</TableCell>
      <TableCell className="text-center text-sm text-foreground">{c.subjects}</TableCell>
      <TableCell>
        <div className="flex w-32 flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{c.students}</span>
            <span className="text-muted-foreground">{fillPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full",
                fillPct >= 95 ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{c.room}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "font-medium",
            c.status === "Active"
              ? "border-chart-3/20 bg-chart-3/10 text-chart-3"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          {c.status}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 text-right">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Class actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
