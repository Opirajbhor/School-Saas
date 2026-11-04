import { createUpdateSchema } from "drizzle-zod";
import { instituteProfile } from "../drizzle-DB/schema";
import z from "zod";

// Only the fields the profile form edits. Everything else on the row — id,
// user_id, eiin, status — is server-owned: a client that could set them could
// re-point the institute at another account or mark it inactive.
export const insituteProfileUpdateZod = createUpdateSchema(instituteProfile).pick({
  nameBangla: true,
  nameEnglish: true,
  logo: true,
  signature: true,
  phone: true,
  division: true,
  district: true,
  upazila: true,
});

export type InsituteProfileUpdateType = z.infer<
  typeof insituteProfileUpdateZod
>;
