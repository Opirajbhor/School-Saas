"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { resultPerformance, studentGrowth } from "@/lib/dashboard-data"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const growthConfig = {
  students: { label: "Total Students", color: "var(--chart-1)" },
  enrolled: { label: "Enrolled", color: "var(--chart-2)" },
} satisfies ChartConfig

const performanceConfig = {
  count: { label: "Students", color: "var(--chart-1)" },
} satisfies ChartConfig

export function StudentGrowthChart() {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Student Growth</CardTitle>
        <CardDescription>Total vs enrolled students across the session</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={growthConfig} className="h-[280px] w-full">
          <AreaChart data={studentGrowth} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-students)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-students)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillEnrolled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-enrolled)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-enrolled)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="enrolled"
              type="monotone"
              fill="url(#fillEnrolled)"
              stroke="var(--color-enrolled)"
              strokeWidth={2}
            />
            <Area
              dataKey="students"
              type="monotone"
              fill="url(#fillStudents)"
              stroke="var(--color-students)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ResultPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Result Performance</CardTitle>
        <CardDescription>Grade distribution this term</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={performanceConfig} className="h-[280px] w-full">
          <BarChart data={resultPerformance} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="grade" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
