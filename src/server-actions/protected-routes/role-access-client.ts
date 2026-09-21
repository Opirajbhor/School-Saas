// src/hooks/use-can.ts
"use client";

import { useSession } from "../../better-auth/auth-client";

type Role = "admin" | "teacher" | "user";

export function AccessClient(roles: Role | Role[]) {
  const { data: session } = useSession();
  const list = Array.isArray(roles) ? roles : [roles];

  return {
    allowed: session?.user?.role
      ? list.includes(session.user.role as Role)
      : false,
    role: session?.user?.role,
  };
}

// const router = useRouter();
// const { allowed } = AccessClient("admin");
// useEffect(() => {
//   if (!allowed) router.push("/unauthorize"); // ✅ in effect
// }, [allowed, router]);

// if (!allowed) return null;
