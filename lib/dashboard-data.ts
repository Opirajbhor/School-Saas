export const SCHOOL_NAME = "Greenfield International Academy"

export type Stat = {
  label: string
  value: string
  delta: string
  trend: "up" | "down"
  hint: string
}

export const stats: Stat[] = [
  { label: "Total Students", value: "4,287", delta: "+128", trend: "up", hint: "vs last term" },
  { label: "Total Teachers", value: "212", delta: "+6", trend: "up", hint: "vs last term" },
  { label: "Total Classes", value: "48", delta: "+2", trend: "up", hint: "active classes" },
  { label: "Total Subjects", value: "36", delta: "0", trend: "up", hint: "this session" },
  { label: "Published Results", value: "1,964", delta: "+312", trend: "up", hint: "this term" },
  { label: "Pass Rate", value: "92.4%", delta: "-1.2%", trend: "down", hint: "vs last term" },
]

export const studentGrowth = [
  { month: "Jan", students: 3620, enrolled: 3210 },
  { month: "Feb", students: 3740, enrolled: 3380 },
  { month: "Mar", students: 3810, enrolled: 3460 },
  { month: "Apr", students: 3950, enrolled: 3590 },
  { month: "May", students: 4060, enrolled: 3720 },
  { month: "Jun", students: 4180, enrolled: 3880 },
  { month: "Jul", students: 4287, enrolled: 4010 },
]

export const resultPerformance = [
  { grade: "A+", count: 412 },
  { grade: "A", count: 684 },
  { grade: "B", count: 798 },
  { grade: "C", count: 521 },
  { grade: "D", count: 246 },
  { grade: "F", count: 149 },
]

export type Activity = {
  id: string
  actor: string
  initials: string
  action: string
  target: string
  time: string
  kind: "result" | "exam" | "student" | "marks"
}

export const activities: Activity[] = [
  { id: "1", actor: "Amara Okafor", initials: "AO", action: "published results for", target: "Grade 10 — Mid Term", time: "12m ago", kind: "result" },
  { id: "2", actor: "David Mensah", initials: "DM", action: "entered marks for", target: "Physics — Section B", time: "48m ago", kind: "marks" },
  { id: "3", actor: "Sofia Rossi", initials: "SR", action: "created exam", target: "Final Term Mathematics", time: "2h ago", kind: "exam" },
  { id: "4", actor: "Liang Wei", initials: "LW", action: "enrolled new student", target: "Hassan Abdi — Grade 8", time: "3h ago", kind: "student" },
  { id: "5", actor: "Amara Okafor", initials: "AO", action: "published results for", target: "Grade 9 — Mid Term", time: "5h ago", kind: "result" },
  { id: "6", actor: "Priya Nair", initials: "PN", action: "entered marks for", target: "Chemistry — Section A", time: "6h ago", kind: "marks" },
]

export type ResultRow = {
  id: string
  exam: string
  classroom: string
  subjects: number
  students: number
  avg: string
  pass: string
  status: "Published" | "Pending" | "Reviewing"
  date: string
}

export const recentResults: ResultRow[] = [
  { id: "RST-1042", exam: "Mid Term Assessment", classroom: "Grade 10 — A", subjects: 8, students: 96, avg: "78.4%", pass: "94%", status: "Published", date: "Jun 18, 2026" },
  { id: "RST-1041", exam: "Mid Term Assessment", classroom: "Grade 9 — B", subjects: 8, students: 88, avg: "74.1%", pass: "91%", status: "Published", date: "Jun 17, 2026" },
  { id: "RST-1040", exam: "Unit Test 3", classroom: "Grade 12 — Science", subjects: 6, students: 72, avg: "81.2%", pass: "97%", status: "Published", date: "Jun 16, 2026" },
  { id: "RST-1039", exam: "Final Term", classroom: "Grade 8 — C", subjects: 9, students: 104, avg: "69.8%", pass: "88%", status: "Reviewing", date: "Jun 15, 2026" },
  { id: "RST-1038", exam: "Unit Test 3", classroom: "Grade 11 — Commerce", subjects: 7, students: 81, avg: "76.5%", pass: "92%", status: "Pending", date: "Jun 14, 2026" },
]
