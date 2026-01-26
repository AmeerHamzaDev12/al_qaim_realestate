"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/UI/sidebar";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth");
  const isHomePage = pathname === "/";

  if (isAuthPage || isHomePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}