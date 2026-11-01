"use client";

import StatusToggleModal from "@/components/modal/status-modal";
import { ToggleExamStatus } from "../_actions/exam.action";
import AssignExamToClasses, { type AssignableExam } from "./assign-exams";

/** per-row controls that used to live on the removed /exam/create page */
export function ExamRowActions({ exam }: { exam: AssignableExam }) {
  return (
    <div className="flex items-center gap-1">
      <AssignExamToClasses exam={exam} />
      <StatusToggleModal
        id={exam.id}
        onDelete={ToggleExamStatus}
        title="Change exam status"
        description="Inactive exams stop appearing for institutes."
      />
    </div>
  );
}
