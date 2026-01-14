"use client";
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">1,284</h3>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Plots Sold</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">432</h3>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Collected Amount</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">PKR 4.2M</h3>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Outstanding Balance</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">PKR 12.8M</h3>
        </div>
      </div>
    </div>
  );
}