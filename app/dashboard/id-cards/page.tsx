"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IdentificationCard as IdCardIcon, Printer, MagnifyingGlass as Search } from "@phosphor-icons/react/ssr";


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { StudentIdCard, TeacherIdCard } from "@/app/print/_components/id-card";
import { getSectionStudentCards, getTeacherCards } from "@/app/print/_actions/id-card.action";
import { getClassSectionGroups } from "../classes/_actions/classes.action";
import type { sectionType } from "@/src/validation/classes.zod";

// getClassSectionGroups returns classes with their sections attached, but the
// declared type only covers the groups, so the shape is spelled out here.
type ClassWithSections = {
  id: string;
  name: string;
  sections?: sectionType[];
};

type Tab = "students" | "teachers";

export default function Page() {
  const [tab, setTab] = useState<Tab>("students");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const { data: classes = [], isPending: classesLoading } = useQuery<
    ClassWithSections[]
  >({
    queryKey: ["page-id-cards", "classes"],
    queryFn: async () => {
      const result = await getClassSectionGroups();
      if (!result.success) throw new Error(result.error);
      return result.data as ClassWithSections[];
    },
  });

  const sections = useMemo(
    () =>
      (classes.find((item) => item.id === classId)?.sections ?? []).filter(
        (section: sectionType) => section.status === "ACTIVE",
      ),
    [classes, classId],
  );

  const { data: studentCards = [], isFetching: studentsLoading } = useQuery({
    queryKey: ["page-id-cards", "students", sectionId],
    enabled: Boolean(sectionId),
    queryFn: async () => {
      const result = await getSectionStudentCards(sectionId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: teacherCards = [], isFetching: teachersLoading } = useQuery({
    queryKey: ["page-id-cards", "teachers"],
    enabled: tab === "teachers",
    queryFn: async () => {
      const result = await getTeacherCards();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  if (classesLoading) return <PageSkeleton />;

  const printHref =
    tab === "students"
      ? `/print/students/id-cards?sectionId=${sectionId}`
      : "/print/teachers/id-cards";

  const canPrint = tab === "students" ? Boolean(sectionId) : true;
  const count = tab === "students" ? studentCards.length : teacherCards.length;
  const loading = tab === "students" ? studentsLoading : teachersLoading;

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="ID cards"
        subtitle="Print student and teacher identity cards. Use “Save as PDF” in the print dialog to download."
        actions={
          <Button size="sm" asChild disabled={!canPrint || count === 0}>
            <Link
              href={canPrint && count > 0 ? printHref : "#"}
              target="_blank"
              rel="noopener"
              aria-disabled={!canPrint || count === 0}
              className={!canPrint || count === 0 ? "pointer-events-none opacity-50" : ""}
            >
              <Printer />
              Print {tab === "students" ? "section" : "all teachers"}
            </Link>
          </Button>
        }
      />

      {/* tabs */}
      <div className="flex items-center gap-1">
        <TabButton
          active={tab === "students"}
          onClick={() => setTab("students")}
          label="Students"
        />
        <TabButton
          active={tab === "teachers"}
          onClick={() => setTab("teachers")}
          label="Teachers"
        />
      </div>

      {tab === "students" && (
        <Card className="gap-0 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-56">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Class
              </label>
              <Combobox
                options={classes.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                value={classId || null}
                onValueChange={(value) => {
                  setClassId(value ?? "");
                  setSectionId("");
                }}
                placeholder="Select a class"
                searchPlaceholder="Search class…"
              />
            </div>

            <div className="w-full sm:w-56">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Section
              </label>
              <Combobox
                options={sections
                  .filter((section: sectionType) => section.id)
                  .map((section: sectionType) => ({
                    label: `Section ${section.name}`,
                    value: section.id as string,
                  }))}
                value={sectionId || null}
                onValueChange={(value) => setSectionId(value ?? "")}
                placeholder={
                  sections.length === 0
                    ? "No sections in this class"
                    : "Select a section"
                }
                searchPlaceholder="Search section…"
                disabled={sections.length === 0}
              />
            </div>

            <p className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Search className="size-3.5" />
              Or open a single card from a student or teacher row.
            </p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Spinner />
          Loading cards...
        </div>
      ) : count === 0 ? (
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <IdCardIcon className="size-8" />
          <p className="text-sm font-medium text-foreground">
            {tab === "students"
              ? sectionId
                ? "No active students in this section"
                : "Pick a class and section"
              : "No active teachers on record"}
          </p>
          <p className="text-xs text-muted-foreground">
            {tab === "students"
              ? "Cards are built from enrolment data, so a section needs at least one active student."
              : "Add a teacher first, then their card appears here."}
          </p>
        </Card>
      ) : (
        <Card className="gap-0 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Preview · {count} {count === 1 ? "card" : "cards"}
            </p>
            <p className="text-xs text-muted-foreground">
              What prints is exactly this layout
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {tab === "students"
              ? studentCards.map((card) => (
                  <StudentIdCard key={card.student.id} data={card} />
                ))
              : teacherCards.map((card) => (
                  <TeacherIdCard key={card.teacher.id} data={card} />
                ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
          : "rounded-md border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
      }
    >
      {label}
    </button>
  );
}
