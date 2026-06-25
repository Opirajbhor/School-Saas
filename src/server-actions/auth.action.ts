"use server";
import { auth } from "../../auth";
import { SignUpType, signUpZod } from "../validation/auth.zod";
import { instituteProfile } from "../db/schema/institute-profile-schema.drizzle";
import { db } from "../db";

export async function signUpAction(data: SignUpType) {
  // logic here
  // zod validation----------
  const parsed = signUpZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid data",
    };
  }

  // better auth user creation--------

  const authUser = await auth.api.signUpEmail({
    body: {
      name: parsed.data.adminNameEnglish,
      email: parsed.data.email,
      password: parsed.data.password,
    },
  });
  console.log(parsed.data);
  console.log(authUser);

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
}
