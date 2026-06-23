import { HeroHeader } from "@/components/home/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <HeroHeader />
      {children}
    </div>
  );
}
