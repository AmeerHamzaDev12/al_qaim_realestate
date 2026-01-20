"use client";

import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500">
          Welcome back, {user?.name || "User"} ({user?.role?.toUpperCase() || "USER"})
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-gray-900 font-medium">{getCurrentDate()}</p>
          <p className="text-gray-400 text-sm">Local Office Time</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors">
          <User className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
}