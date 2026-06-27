import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["INSTITUTE_ADMIN", "TEACHER"]);

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);

export const religionEnum = pgEnum("religion", [
  "ISLAM",
  "HINDUISM",
  "CHRISTIANITY",
  "BUDDHISM",
  "OTHER",
]);

export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"]);
