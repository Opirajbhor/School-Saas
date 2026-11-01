import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getSectionStudentCards } from "../../_actions/id-card.action";
import { PrintBar } from "../../_components/print-bar";
import { StudentIdCard } from "../../_components/id-card";

// A4 sheet of cards for one section.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { sectionId } = await searchParams;
  if (!sectionId) notFound();

  const result = await getSectionStudentCards(sectionId);
  if (!result.success) notFound();

  const cards = result.data;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Student ID cards"
        subtitle={`${cards.length} ${cards.length === 1 ? "card" : "cards"} · print, or choose “Save as PDF”`}
        backHref="/dashboard/id-cards"
        backLabel="ID cards"
      />

      {cards.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No cards to print
          </p>
          <p className="text-xs text-muted-foreground">
            This section has no active students enrolled.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 print:gap-2">
          {cards.map((card) => (
            <StudentIdCard key={card.student.id} data={card} />
          ))}
        </div>
      )}
    </div>
  );
}
