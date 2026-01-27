import { IconAt, IconCalendar, IconChevronDown } from "@tabler/icons-react";
import { Avatar, Card, Group, Text } from "@mantine/core";
import { UserProfile } from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

interface UserInfoIconsProps {
  user: UserProfile | null;
  loading: boolean;
}

export function UserInfoIcons({ user, loading }: UserInfoIconsProps) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  if (loading) {
    return (
      <div className="w-full flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="w-full text-gray-400">User not found</div>;
  }

  return (
    <div className="relative w-full">
      {/* Collapsed Row */}
      <button
        className="flex items-center gap-2 px-3 h-12 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition group focus:outline-none min-w-45"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Avatar
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&bold=true&size=128`}
          size={32}
          radius="xl"
          className="border-2 border-white shadow w-8! h-8!"
        />
        <span className="font-semibold text-gray-900 text-sm truncate max-w-25">
          {user.name}
        </span>
        <IconChevronDown
          size={18}
          className={`ml-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Dropdown Details */}
      {open && (
        <div className="absolute right-0 mt-2 w-47 bg-white border border-gray-200 rounded-xl shadow-xl z-20 animate-fadeIn overflow-hidden">
          <div className="flex flex-col items-center p-5 pb-3">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&bold=true&size=128`}
              size={48}
              radius="xl"
              className="border-2 border-white shadow w-12! h-12! rounded-full!"
            />
            <div className="mt-2 text-center">
              <div className="font-semibold text-gray-900 text-base">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-purple-100 border border-purple-200 rounded-full text-xs text-purple-700 font-semibold uppercase">
                Registered User
              </div>
              <div className="flex items-center gap-1 justify-center text-gray-400 text-xs mt-2">
                <IconCalendar size={14} />
                Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 border-t border-gray-100 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
