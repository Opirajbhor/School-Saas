import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import { redirect } from "next/navigation";

export default async function LoginupPage() {
  // server session api
  const session = await currentUser();
  if (session?.session?.token) {
    await redirect("/dashboard");
  }

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
