import { SignupForm } from "@/components/signup-form";
import { PiShieldChevronBold } from "react-icons/pi";
import Link from "next/link";
import { auth } from "@/auth";
import { headers } from "next/headers";

export default async function SignupPage() {
  return (
    <div className="flex flex-col p-6">
      {/* Logo */}
      <div className="flex justify-center gap-2 md:justify-start">
        <Link
          href="/"
          aria-label="home"
          className="flex gap-1 items-center space-x-2"
        >
          <PiShieldChevronBold size={30} />
          Educare
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-lvh">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
