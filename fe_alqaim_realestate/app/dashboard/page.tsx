"use client";

import PageLayout from "@/components/UI/PageLayout";
import { Users, Wallet, TrendingUp, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const stats = [
    { title: "Total Customers", value: "156", icon: Users, color: "bg-blue-500" },
    { title: "Total Payments", value: "PKR 45M", icon: Wallet, color: "bg-emerald-500" },
    { title: "Pending Payments", value: "PKR 12M", icon: TrendingUp, color: "bg-orange-500" },
    { title: "Total Plots", value: "89", icon: FileText, color: "bg-purple-500" },
  ];
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Jab tak loading ho, kuch bhi render na karein
  if (authLoading) return null;

  // Agar authenticated nahi hai, kuch bhi render na karein (redirect ho jayega)
  if (!isAuthenticated) return null;

  return (
    <PageLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add more dashboard content here */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500">Dashboard content coming soon...</p>
      </div>
    </PageLayout>
  );
}