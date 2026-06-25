"use server";
import { auth } from "../../auth";
import { SignUpType, signUpZod } from "../validation/auth.zod";
import { instituteProfile } from "../db/schema/institute-profile-schema.drizzle";
import { db } from "../db";
import { redirect } from "next/navigation";

export async function signUpAction(data: SignUpType) {
  // zod validation----------
  const parsed = signUpZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input data. Please check your fields.",
    };
  }
  // better auth user creation--------
  try {
    const authUser = await auth.api.signUpEmail({
      body: {
        name: parsed.data.adminNameEnglish,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    // Ensuring the auth user was actually created before moving to DB insert
    if (!authUser?.user?.id) {
      return { success: false, error: "Failed to create authentication user." };
    }
    // institute profile
    await db.insert(instituteProfile).values({
      userId: authUser.user.id,
      eiin: parsed.data.eiin,
      instituteNameBangla: parsed.data.instituteNameBangla,
      instituteNameEnglish: parsed.data.instituteNameEnglish,
      adminNameBangla: parsed.data.adminNameBangla,
      adminNameEnglish: parsed.data.adminNameEnglish,
      adminDesignation: parsed.data.adminDesignation,
      adminPhone: parsed.data.adminPhone,
      division: parsed.data.division,
      district: parsed.data.district,
      upazila: parsed.data.upazila,
    });
    return { success: true };
  } catch (error) {
    console.error("Signup Action Error:", error);
    return {
      success: false,
      error: error || "An unexpected database error occurred.",
    };
  }
}
