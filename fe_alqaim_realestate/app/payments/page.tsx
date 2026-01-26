"use client";

import { useEffect, useState } from "react";
import {
  getAllCustomers,
  getAllPayments,
  addPayment,
  updatePayment,
  downloadReceipt,
  Payment,
  PaymentFormData,
  deletePayment,
} from "@/lib/api";
import { Edit, Trash, Search, Download, X, BookOpen } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageLayout from "@/components/UI/PageLayout";
import { Progress } from "@/components/UI/progress";

const badgeStyles: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700",
  BANK: "bg-blue-100 text-blue-700",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormData>({
    customerId: "",
    method: "CASH",
    date: "",
    amount: "",
  });
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
    async function fetchData() {
      setLoading(true);
      const [custRes, payRes] = await Promise.all([
        getAllCustomers(),
        getAllPayments(),
      ]);

      if (custRes.success && Array.isArray(custRes.data)) {
        setCustomers(
          custRes.data.map((c: any) => ({ id: c.id, name: c.name })),
        );
      }

      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
        setFilteredPayments(payRes.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(
        payments.filter(
          (p) =>
            p.receipt.toLowerCase().includes(search.toLowerCase()) ||
            p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.method.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, payments]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = editId
      ? await updatePayment(editId, form)
      : await addPayment(form);

    if (res.success) {
      const payRes = await getAllPayments();
      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
        setFilteredPayments(payRes.data);
      }
      closeModal();
    } else {
      alert(res.message || "Operation failed");
    }
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ customerId: "", method: "CASH", date: "", amount: "" });
  };

  const handleEdit = (p: Payment) => {
    setEditId(p.id);
    setForm({
      customerId: p.customerId,
      method: p.method,
      date: p.date.split("T")[0],
      amount: p.amount.toString(),
    });
    setShowModal(true);
  };

  const handleDownloadReceipt = async (id: string) => {
    const res = await downloadReceipt(id);
    if (res.success && res.blob) {
      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payment?"))
      return;
    setLoading(true);
    const res = await deletePayment(id);
    if (res.success) {
      const payRes = await getAllPayments();
      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
        setFilteredPayments(payRes.data);
      }
    } else {
      alert(res.message || "Failed to delete payment");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-1/2 max-w-xs">
          <Progress value={progress} />
          <div className="text-center text-black mt-2 font-medium">
            Loading payments...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout title="Payments">
        {/* Search + Button */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by receipt, customer or method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 font-medium cursor-pointer"
            >
              + Add Payment
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-left text-sm text-gray-500">Receipt</th>
                <th className="p-4 text-left text-sm text-gray-500">
                  Customer
                </th>
                <th className="p-4 text-left text-sm text-gray-500">Method</th>
                <th className="p-4 text-left text-sm text-gray-500">Date</th>
                <th className="p-4 text-left text-sm text-gray-500">Amount</th>
                <th className="p-4 text-left text-sm text-gray-500">Receipt</th>
                <th className="p-4 text-left text-sm text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="p-4 text-sm">{p.receipt}</td>
                  <td className="p-4 font-semibold">{p.customer?.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles[p.method]}`}
                    >
                      {p.method}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{p.date.split("T")[0]}</td>
                  <td className="p-4 font-semibold">
                    PKR {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDownloadReceipt(p.id)}
                      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        title="Edit"
                        onClick={() => handleEdit(p)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteId(p.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No payments found
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6">
                {editId ? "Edit Payment" : "Add Payment"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  name="method"
                  value={form.method}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                </select>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Amount (PKR)"
                  className="w-full p-3 border rounded-lg"
                  required
                />

                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 cursor-pointer"
                >
                  {editId ? "Update Payment" : "Save Payment"}
                </button>
              </form>
            </div>
          </div>
        )}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-sm text-center relative">
              <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
              <p className="mb-6 text-gray-600">
                Are you Sure to delete this payment?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleDelete(deleteId);
                    setDeleteId(null);
                  }}
                  className="px-5 py-2 rounded bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </ProtectedRoute>
  );
}
