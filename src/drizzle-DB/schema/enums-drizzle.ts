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

export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};
