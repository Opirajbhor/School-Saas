"use client";

import Link from "next/link";
import { FileSpreadsheet, Printer, ScrollText, Trophy, UserSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shortcuts from the results page into the printable reports for the exam and
// class that is currently loaded. Each opens in a new tab so the working sheet
// is not lost, and carries the section filter along.
export function ReportLinks({
  examId,
  classId,
  sectionId,
}: {
  examId: string;
  classId: string;
  sectionId?: string;
}) {
  const base = `/print/results/${examId}/${classId}`;
  const query = sectionId ? `?section=${sectionId}` : "";

  const reports = [
    { href: `${base}/report-card${query}`, label: "Report Cards", icon: UserSquare },
    { href: `${base}/tabulation${query}`, label: "Tabulation", icon: FileSpreadsheet },
    { href: `${base}/summary${query}`, label: "Subject Summary", icon: ScrollText },
    { href: `${base}/merit${query}`, label: "Merit List", icon: Trophy },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Printer className="size-3.5" />
        Print:
      </span>
      {reports.map((report) => (
        <Button key={report.href} variant="outline" size="sm" asChild>
          <Link href={report.href} target="_blank" rel="noreferrer">
            <report.icon />
            {report.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
