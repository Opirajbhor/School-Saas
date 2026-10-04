"use server";
import { instituteProfile } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// change status of Institute
export async function changeStatusInstitute(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.instituteProfile.findFirst({
        where: eq(instituteProfile.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(instituteProfile)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(instituteProfile.id, id))
        .returning();
    });
    revalidatePath("/super-admin/institute");
    revalidatePath("/dashboard");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("insitute status failed:", error);

    return {
      success: false as const,
      error: "Failed to change status of institute",
      details: {},
    };
  }
}

// delete Institute
export async function deleteInstitute(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx
        .delete(instituteProfile)
        .where(eq(instituteProfile.id, id))
        .returning();
    });
    revalidatePath("/super-admin/institute");
    revalidatePath("/dashboard");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("insitute status failed:", error);

    return {
      success: false as const,
      error: "Failed to change status of institute",
      details: {},
    };
  }
}
