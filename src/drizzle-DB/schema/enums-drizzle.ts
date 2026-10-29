import { pgEnum, timestamp } from "drizzle-orm/pg-core";

// driggle enums

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);

export const religionEnum = pgEnum("religion", [
  "ISLAM",
  "HINDUISM",
  "CHRISTIANITY",
  "BUDDHISM",
  "OTHER",
]);

export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"]);
export const subjectTypeEnum = pgEnum("subject_type", [
  "COMPULSORY",
  "GROUP_BASED",
]);

// how far an entered mark sheet has progressed. `status` stays the
// soft-delete flag; this one is the workflow state.
export const markEntryStatusEnum = pgEnum("mark_entry_status", [
  "DRAFT",
  "SUBMITTED",
]);

// a teacher can ask to unlock submitted marks; an admin approves or rejects
export const markEditRequestStatusEnum = pgEnum("mark_edit_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

// exam-level lock. FINALIZED still lets an admin reopen; PUBLISHED is final.
export const markWorkflowEnum = pgEnum("mark_workflow", [
  "OPEN",
  "FINALIZED",
  "PUBLISHED",
]);

export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};
