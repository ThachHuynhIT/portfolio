"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-950 text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">{children}</main>
    </div>
  );
}
