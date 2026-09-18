// app/access-denied/page.tsx
import { currentUser } from "@/src/server-actions/auth/currentUser.action";
import Link from "next/link";

export default async function AccessDeniedPage() {
  const profile = await currentUser();
  const ctx = profile?.user;
  const home = ctx?.role === "admin" ? "/dashboard" : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to view this page.
        </p>
        {ctx ? (
          <Link
            href={home}
            className="rounded-lg bg-primary px-5 py-2.5 text-white"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
