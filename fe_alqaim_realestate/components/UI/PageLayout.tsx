"use client";
import { use, useEffect, useState } from "react";
import { UserInfoIcons } from "@/components/UserInfoIcons/UserInfoIcons";
import { useAuth } from "@/context/AuthContext";
interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  const { user, loading } = useAuth();

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">Welcome back, {user?.name || "User"}</p>
        </div>
        <div className="flex items-center gap-4 min-w-85 max-w-full">
          <div className="text-right leading-tight">
            <p className="text-gray-900 font-medium">{getCurrentDate()}</p>
            <p className="text-gray-400 text-xs">Local Office Time</p>
          </div>
          <UserInfoIcons user={user} loading={loading} />
        </div>
      </div>
      {children}
    </div>
  );
}