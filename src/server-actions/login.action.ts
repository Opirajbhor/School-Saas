"use server";
import { redirect } from "next/navigation";
import { LogInType, logInZod } from "../validation/auth.zod";
import { auth } from "@/auth";
import { parseWithZod } from "../validation/validator.zod";

export async function loginAction(data: LogInType) {
  let isSuccesfull: boolean = false;
  // parse with zod-----------------
  const parsed = parseWithZod(logInZod, data);
  if (!parsed.success) return parsed;
  // parse with zod-----------------

  try {
    const currentUser = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    if (currentUser) {
      isSuccesfull = true;
    }
  } catch (error) {
    console.error(error);
  }
  if (isSuccesfull) {
    redirect("/dashboard");
  }
}
