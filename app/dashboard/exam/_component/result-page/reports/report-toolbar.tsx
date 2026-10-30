"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// On-screen controls for a print report: go back to the results page, jump to
// the other reports for the same exam + class, and print. Hidden on paper.
export default function ReportToolbar({
  report,
  examId,
  classId,
  options,
}: {
  report: string;
  examId: string;
  classId: string;
  options: { sectionId?: string; studentId?: string };
}) {
  const query = options.sectionId ? `?section=${options.sectionId}` : "";
  const base = `/print/results/${examId}/${classId}`;

  const links = [
    { key: "report-card", label: "Report Cards", href: `${base}/report-card${query}` },
    { key: "tabulation", label: "Tabulation", href: `${base}/tabulation${query}` },
    { key: "summary", label: "Subject Summary", href: `${base}/summary${query}` },
    { key: "merit", label: "Merit List", href: `${base}/merit${query}` },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/results">
            <ArrowLeft />
            Back to Results
          </Link>
        </Button>

        {links.map((link) => (
          <Button
            key={link.key}
            variant={link.key === report ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>

      <Button size="sm" onClick={() => window.print()}>
        <Printer />
        Print / Save as PDF
      </Button>
    </div>
  );
}
