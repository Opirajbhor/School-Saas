"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { FaRegUserCircle } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import Link from "next/link";
import { MdPowerSettingsNew } from "react-icons/md";
import { authClient } from "@/src/better-auth/auth-client";
import { useRouter } from "next/navigation";
import RedBadge from "./alert-notice/red-badge";

// --------------------------
interface UserProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified: boolean;
}
interface DashboardProfileProps {
  user: UserProps | null | undefined;
}
// --------------------------
const profileItems = [
  {
    title: "Profile",
    link: "/dashboard/profile",
    icon: <FaRegUserCircle />,
  },
  {
    title: "School Settings",
    link: "/dashboard/settings",
    icon: <IoMdSettings />,
  },
];

const DashboardProfile = ({ user }: DashboardProfileProps) => {
  const router = useRouter();

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-secondary">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              <Image
                src={user?.image || "/avatar.png"}
                alt={user?.name || "user"}
                height={30}
                width={30}
                className="rounded-full"
              />
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight lg:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {!user?.emailVerified ? (
                <RedBadge title="Not Verified" />
              ) : (
                user?.email
              )}
            </p>
          </div>
          <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {profileItems.map((item, i) => (
            <DropdownMenuItem key={i}>
              <Link
                className="flex items-center justify-center gap-2"
                href={item.link}
              >
                {item.icon}
                {item.title}
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await authClient.signOut();
              router.push("/auth/login");
            }}
            className="flex items-center  cursor-pointer gap-2"
          >
            <MdPowerSettingsNew />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DashboardProfile;
