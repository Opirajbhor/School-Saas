import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getTeacherCards } from "../../_actions/id-card.action";
import { PrintBar } from "../../_components/print-bar";
import { TeacherIdCard } from "../../_components/id-card";

// Every active teacher's card on one sheet.
export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const result = await getTeacherCards();
  if (!result.success) notFound();

  const cards = result.data;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Teacher ID cards"
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
            No active teachers are on record for this institute.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 print:gap-2">
          {cards.map((card) => (
            <TeacherIdCard key={card.teacher.id} data={card} />
          ))}
        </div>
      )}
    </div>
  );
}
