import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { timestamps } from "./enums-drizzle";
import { classesDrizzle } from "./classes.drizzle";

// groups
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    status: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    unique("groups_institute_name_unique").on(table.instituteId, table.name),

    index("groups_institute_id_idx").on(table.instituteId),
  ],
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  institute: one(instituteProfile, {
    fields: [groups.instituteId],
    references: [instituteProfile.id],
  }),
  groupClasses: many(groupClasses),
}));

// groups and classes
export const groupClasses = pgTable(
  "group_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [
    unique("group_classes_group_class_unique").on(table.groupId, table.classId),

    index("group_classes_group_id_idx").on(table.groupId),
    index("group_classes_class_id_idx").on(table.classId),
  ],
);

export const groupClassesRelations = relations(groupClasses, ({ one }) => ({
  group: one(groups, {
    fields: [groupClasses.groupId],
    references: [groups.id],
  }),

  class: one(classesDrizzle, {
    fields: [groupClasses.classId],
    references: [classesDrizzle.id],
  }),
}));
