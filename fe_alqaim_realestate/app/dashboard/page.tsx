"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/UI/PageLayout";
import { Users, Wallet, TrendingUp, FileText } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  getDashboardSummary,
  DashboardSummary,
  getWeeklyCollectionSummary,
  getRecentPayments,
} from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Progress } from "@/components/UI/progress";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    if (!loading) return;
    const t1 = setTimeout(() => setProgress(50), 500);
    const t2 = setTimeout(() => setProgress(100), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  useEffect(() => {
    async function fetchStats() {
      const res = await getDashboardSummary();
      if (res.success) {
        setStats(res.data ?? null);
      } else {
        setStats(null);
      }
      setLoading(false);
    }
    async function fetchWeekly() {
      const res = await getWeeklyCollectionSummary();
      if (res.success) {
        setWeeklyData(
          Object.entries(res.data ?? {}).map(([day, amount]) => ({
            day,
            amount,
          })),
        );
      }
    }
    async function fetchRecent() {
      const res = await getRecentPayments();
      if (res.success) setRecentPayments(res.data);
    }
    fetchStats();
    fetchWeekly();
    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-1/2 max-w-xs">
          <Progress value={progress} />
          <div className="text-center text-black mt-2 font-medium">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-red-500">Failed to load dashboard data.</div>
    );
  }

  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Plots Sold",
      value: stats.plotsSold,
      icon: FileText,
      color: "bg-purple-500",
    },
    {
      title: "Collected Amount",
      value: `PKR ${stats.collectedAmount}`,
      icon: Wallet,
      color: "bg-emerald-500",
    },
    {
      title: "Outstanding Balance",
      value: `PKR ${stats.outstandingBalance}`,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <ProtectedRoute>
      <PageLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Collection Summary Graph */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Weekly Collection Summary
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Activities
            </h2>
            <ul>
              {recentPayments.length === 0 && (
                <li className="text-gray-500">No recent payments found.</li>
              )}
              {recentPayments.slice(0, 3).map((payment: any) => (
                <li key={payment.id} className="flex items-center gap-3 mb-4">
                  <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      Payment Received
                    </div>
                    <div className="text-gray-500 text-sm">
                      {payment.customer?.name} paid PKR{" "}
                      {payment.amount.toLocaleString()} for Plot{" "}
                      {payment.customer?.plot}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(payment.date).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
