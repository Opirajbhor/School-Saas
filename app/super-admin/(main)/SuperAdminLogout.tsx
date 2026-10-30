"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MdPowerSettingsNew } from "react-icons/md";
import { authClient } from "@/src/better-auth/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Same sign-out flow as the dashboard profile menu: end the better-auth session,
// then send the user to the login page.
export default function SuperAdminLogout() {
  const router = useRouter();
  const [load, setLoad] = useState(false);

  const handleSignOut = async () => {
    setLoad(true);
    try {
      await authClient.signOut();
      router.push("/auth/login");
      // keep the button in its loading state until the navigation lands
      router.refresh();
    } catch (error) {
      console.error("sign out failed:", error);
      setLoad(false);
    }
  };

  return (
    <Button
      variant="outline"
      disabled={load}
      onClick={handleSignOut}
      aria-label="Sign out"
    >
      {load ? (
        <Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MdPowerSettingsNew className="mr-2 h-4 w-4" />
      )}
      Sign out
    </Button>
  );
}
