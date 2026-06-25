"use server";
import { redirect } from "next/navigation";
import { LogInType, logInZod } from "../validation/auth.zod";
import { auth } from "@/auth";

export async function loginAction(data: LogInType) {
  let isSuccesfull: boolean = false;
  // -----zod validation----------
  const parsed = logInZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid data",
    };
  }
  try {
    const currentUser = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    if (currentUser) {
      isSuccesfull = true;
      console.log(currentUser);
    }
  } catch (error) {
    console.log(error);
  }
  if (isSuccesfull) {
    redirect("/dashboard");
  }
}
