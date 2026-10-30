import type { Metadata } from "next";

// Documents that are meant for paper. This layout deliberately does not use
// DashboardShell: a print route must not render the sidebar or topbar.
export const metadata: Metadata = {
  title: "Result Report",
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-white text-black">{children}</div>;
}
