import { LoginForm } from "@/components/login-form";
import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import { redirect } from "next/navigation";

export default async function LoginupPage() {
  // server session api
  const session = await currentUser();
  if (session?.session?.token) {
    await redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-lvh">
        <LoginForm />;
      </div>
    </div>
  );
}
