"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogInType, logInZod } from "@/src/validation/auth.zod";
import { parseWithZod } from "@/src/validation/validator.zod";

export async function loginAction(data: LogInType) {
  let isSuccesfull: boolean = false;
  // parse with zod-----------------
  const parsed = parseWithZod(logInZod, data);
  if (!parsed.success) return parsed;
  // parse with zod-----------------

  let role: string | undefined;
  try {
    const currentUser = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    if (currentUser) {
      isSuccesfull = true;
      // each area lives behind its own guard, so send the user to the one their
      // role can actually open; a superadmin has no institute, so letting it
      // fall through to /dashboard leaves it on a page with no tenant context.
      role = (currentUser.user as { role?: string }).role;
    }
  } catch (error) {
    console.error(error);
  }
  if (isSuccesfull) {
    if (role === "superadmin") {
      redirect("/super-admin/institutes");
    }
    redirect("/dashboard");
  }

  // wrong credentials used to return undefined, which left the form looking like
  // the button did nothing
  return {
    success: false as const,
    error: "Invalid email or password",
    details: {},
  };
}
