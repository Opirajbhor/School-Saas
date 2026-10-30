import { MdOutlineClass, MdSubject } from "react-icons/md";
import { PiLinkSimple } from "react-icons/pi";
import { LiaLayerGroupSolid } from "react-icons/lia";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import SuperAdminLogout from "./SuperAdminLogout";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // platform-wide default data, so only a superadmin may see this section. The
  // guard lives here so every page underneath it is covered at once.
  const { allowed } = await AccessServer("superadmin");
  if (!allowed) redirect("/unauthorize");

  const links = [
    {
      name: "Institutes",
      link: "/super-admin/institutes",
      icon: <PiLinkSimple />,
    },
    {
      name: "Sessions",
      link: "/super-admin/academic-sessions",
      icon: <PiLinkSimple />,
    },
    {
      name: "Classes",
      link: "/super-admin/classes",
      icon: <MdOutlineClass />,
    },
    {
      name: "Groups",
      link: "/super-admin/groups",
      icon: <LiaLayerGroupSolid />,
    },
    {
      name: "Subjects",
      link: "/super-admin/subjects",
      icon: <MdSubject />,
    },
    {
      name: "Exam",
      link: "/super-admin/exam",
      icon: <MdSubject />,
    },
    {
      name: "Superadmins",
      link: "/super-admin/superadmins",
      icon: <ShieldCheck />,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
        {links.map((item, i) => (
          <Link
            className="flex gap-1 items-center underline border bg-outline p-3 rounded-2xl"
            key={i}
            href={item.link}
          >
            {item.icon} {item.name}
          </Link>
        ))}
        <SuperAdminLogout />
      </div>
      <div>{children}</div>
    </div>
  );
}
