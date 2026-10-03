import { MdOutlineClass, MdSubject } from "react-icons/md";
import { PiLinkSimple } from "react-icons/pi";
import { LiaLayerGroupSolid } from "react-icons/lia";
import Link from "next/link";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  ];

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mt-5">
        {links.map((item, i) => (
          <Link
            className="flex gap-1 items-center underline border bg-outline p-3 rounded-2xl"
            key={i}
            href={item.link}
          >
            {item.icon} {item.name}
          </Link>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
