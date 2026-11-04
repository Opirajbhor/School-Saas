"use server";

import { currentUser } from "@/src/server-actions/auth/currentUser.action";

/**
 * Platform-admin gate for server actions.
 *
 * Server actions are public RPC endpoints: anything rendered behind
 * `AccessServer("superadmin")` is still callable by an ordinary session unless
 * the action itself checks the role. This reads the role straight off the
 * session rather than through getUserContext(), because a superadmin has no
 * institute and therefore no `teachers` row.
 */
export async function requireSuperAdmin() {
  const session = await currentUser();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }

  if (user.role !== "superadmin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }

  return {
    success: true as const,
    data: { userId: user.id as string, role: "superadmin" as const },
  };
}
