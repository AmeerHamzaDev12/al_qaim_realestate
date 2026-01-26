"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FolderKanban,
  FileText,
  LogOut,
  Building2,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Wallet,
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, isAuthenticated, loading: authLoading } = useAuth();
  if (authLoading) return null;
  if (!isAuthenticated) return null;
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-slate-800 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Image
            src="/Gemini_Generated_Image_h2fpy2h2fpy2h2fp-removebg-preview.png"
            alt="Logo"
            width={40}
            height={40}
          />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">AL-QAIM</h1>
          <p className="text-emerald-400 text-xs">ASSOCIATES & BUILDERS</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-emerald-500 text-white"
                  : "text-gray-300 hover:bg-slate-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
