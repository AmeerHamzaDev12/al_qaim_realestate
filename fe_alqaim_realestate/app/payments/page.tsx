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
  Customer,
} from "@/lib/api";
import { Edit, Trash, Search, Download, X, BookOpen } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageLayout from "@/components/UI/PageLayout";
import { Progress } from "@/components/UI/progress";
import { toast, Toaster } from "sonner";
import { z } from "zod";

const badgeStyles: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700",
  BANK: "bg-blue-100 text-blue-700",
};

const cashPaymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  method: z.string().min(1, "Please select payment method"),
  paymentStructure: z.literal("CASH"),
  date: z.string().min(1, "Please select payment date"),
  amount: z
    .string()
    .min(1, "Please enter amount")
    .refine((val) => Number(val) > 0, "Please enter a valid amount"),
  installmentNumber: z.any().optional(),
});

const installmentPaymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  method: z.string().min(1, "Please select payment method"),
  paymentStructure: z.literal("INSTALLMENT"),
  date: z.string().min(1, "Please select payment date"),
  amount: z
    .string()
    .min(1, "Please enter amount")
    .refine((val) => Number(val) > 0, "Please enter a valid amount"),
  installmentNumber: z
    .number({ error: "Please enter installment number" })
    .min(1, "Please enter a valid installment number"),
});

const paymentFormSchema = z.discriminatedUnion("paymentStructure", [
  cashPaymentSchema,
  installmentPaymentSchema,
]);

type FieldErrors = Record<string, string>;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormData>({
    customerId: "",
    method: "",
    paymentStructure: "",
    date: "",
    amount: "",
    installmentNumber: undefined,
  });
  const [progress, setProgress] = useState(25);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  useEffect(() => {
    if (!loading) return;
    const t1 = setTimeout(() => setProgress(50), 500);
    const t2 = setTimeout(() => setProgress(100), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const fetchPayments = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const payRes = await getAllPayments();
      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
        setFilteredPayments(payRes.data);
      } else {
        toast.error("Failed to load payments");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [custRes, payRes] = await Promise.all([
          getAllCustomers(),
          getAllPayments(),
        ]);

        if (custRes.success && Array.isArray(custRes.data)) {
          setCustomers(custRes.data);
        } else {
          toast.error("Failed to load customers");
        }

        if (payRes.success && Array.isArray(payRes.data)) {
          setPayments(payRes.data);
          setFilteredPayments(payRes.data);
        } else {
          toast.error("Failed to load payments");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load data");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPayments]);

  useEffect(() => {
    if (selectedCustomer && !editId) {
      setForm((prev) => ({
        ...prev,
        paymentStructure: selectedCustomer.paymentType || "",
        installmentNumber: undefined,
      }));
    }
  }, [form.customerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "installmentNumber"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Zod validation
    const result = paymentFormSchema.safeParse(form);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    // Extra: installment number cannot exceed total installments
    if (
      form.paymentStructure === "INSTALLMENT" &&
      form.installmentNumber &&
      selectedCustomer?.totalInstallments &&
      form.installmentNumber > selectedCustomer.totalInstallments
    ) {
      setFieldErrors({
        installmentNumber: `Installment number cannot exceed ${selectedCustomer.totalInstallments}`,
      });
      toast.error(
        `Installment number cannot exceed ${selectedCustomer.totalInstallments}`,
      );
      return;
    }

    setSubmitting(true);
    const isEditing = !!editId;

    try {
      const res = isEditing
        ? await updatePayment(editId!, form)
        : await addPayment(form);

      if (res.success) {
        closeModal();
        toast.success(
          isEditing
            ? "Payment updated successfully!"
            : "Payment added successfully!",
        );
        await fetchPayments(false); // false = don't show loader, keep Toaster mounted
      } else {
        // Show backend error message (e.g., "Installment #1 already exists")
        toast.error(res.message || "Operation failed");
      }
    } catch (err: any) {
      // Show backend error from response
      const backendMessage =
        err?.response?.data?.message || err?.message || "Operation failed";
      toast.error(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({
      customerId: "",
      method: "",
      paymentStructure: "",
      date: "",
      amount: "",
      installmentNumber: undefined,
    });
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setFieldErrors({});
  };

  const handleEdit = (p: Payment) => {
    setFieldErrors({});
    setEditId(p.id);
    setForm({
      customerId: p.customerId,
      method: p.method,
      paymentStructure: p.paymentStructure,
      date: p.date.split("T")[0],
      amount: p.amount.toString(),
      installmentNumber: p.installmentNumber,
    });
    setShowModal(true);
  };

  const handleDownloadReceipt = async (id: string) => {
    try {
      const res = await downloadReceipt(id);
      if (res.success && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Receipt downloaded!");
      } else {
        toast.error("Failed to download receipt");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download receipt");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePayment(id);
      if (res.success) {
        setDeleteId(null);
        toast.success("Payment deleted successfully!");
        await fetchPayments(false); // false = don't show loader
      } else {
        toast.error(res.message || "Failed to delete payment");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete payment",
      );
    }
  };

  const customersWithCashPayment = new Set(
    payments
      .filter((p) => p.paymentStructure === "CASH")
      .map((p) => p.customerId),
  );

  const availableCustomers = customers.filter(
    (c) => !customersWithCashPayment.has(c.id),
  );

  const filteredCustomersList = availableCustomers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reusable error text component
  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[name]}</p>
    ) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster position="top-center" richColors />
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
        <Toaster position="top-center" richColors />

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
              onClick={() => {
                setFieldErrors({});
                setShowModal(true);
              }}
              className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 font-medium cursor-pointer"
            >
              + Add Payment
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-left text-sm text-gray-500">Receipt</th>
                <th className="p-4 text-left text-sm text-gray-500">Customer</th>
                <th className="p-4 text-left text-sm text-gray-500">Method</th>
                <th className="p-4 text-left text-sm text-gray-500">Structure</th>
                <th className="p-4 text-left text-sm text-gray-500">Date</th>
                <th className="p-4 text-left text-sm text-gray-500">Amount</th>
                <th className="p-4 text-left text-sm text-gray-500">Info</th>
                <th className="p-4 text-left text-sm text-gray-500">Receipt</th>
                <th className="p-4 text-left text-sm text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="p-4 text-sm">{p.receipt}</td>
                  <td className="p-4 font-semibold">{p.customer?.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles[p.method] || "bg-gray-100 text-gray-700"}`}
                    >
                      {p.method}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${p.paymentStructure === "INSTALLMENT" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {p.paymentStructure}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{p.date.split("T")[0]}</td>
                  <td className="p-4 font-semibold">
                    PKR {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm font-semibold">
                    {p.paymentStructure === "INSTALLMENT"
                      ? p.installmentNumber
                        ? `Installment #${p.installmentNumber}`
                        : "-"
                      : "Full Payment"}
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No payments found
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
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
                {/* Customer Dropdown */}
                <div className="relative">
                  <label className="block text-gray-700 font-medium mb-2">
                    Customer
                  </label>
                  <div
                    className={`w-full p-3 border rounded-lg bg-white cursor-pointer ${fieldErrors.customerId ? "border-red-400" : "border-gray-200"}`}
                    onClick={() => setShowCustomerDropdown((v) => !v)}
                  >
                    {form.customerId
                      ? customers.find((c) => c.id === form.customerId)?.name
                      : "Select Customer"}
                  </div>
                  <FieldError name="customerId" />
                  {showCustomerDropdown && (
                    <div className="absolute z-10 bg-white border w-full rounded-lg shadow mt-1">
                      <input
                        type="text"
                        placeholder="Search customer..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full p-3 border-b rounded-t-lg"
                        autoFocus
                      />
                      <ul className="max-h-48 overflow-y-auto">
                        {filteredCustomersList.length === 0 && (
                          <li className="p-3 text-gray-400">
                            No customers found
                          </li>
                        )}
                        {filteredCustomersList.map((c) => (
                          <li
                            key={c.id}
                            className={`p-3 cursor-pointer hover:bg-emerald-100 ${form.customerId === c.id ? "bg-emerald-50" : ""}`}
                            onMouseDown={() => {
                              setForm((prev) => ({
                                ...prev,
                                customerId: c.id,
                              }));
                              setCustomerSearch("");
                              setShowCustomerDropdown(false);
                              if (fieldErrors.customerId) {
                                setFieldErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.customerId;
                                  return copy;
                                });
                              }
                            }}
                          >
                            {c.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Customer Info Card */}
                {selectedCustomer && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Type:</span>{" "}
                        <span className="font-semibold">
                          {selectedCustomer.paymentType === "INSTALLMENT"
                            ? "Installment"
                            : "Cash (Full)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Price:</span>{" "}
                        <span className="font-semibold">
                          PKR{" "}
                          {Number(
                            selectedCustomer.totalPrice,
                          ).toLocaleString()}
                        </span>
                      </div>
                      {selectedCustomer.paymentType === "INSTALLMENT" && (
                        <>
                          <div>
                            <span className="text-gray-500">
                              Total Installments:
                            </span>{" "}
                            <span className="font-semibold">
                              {selectedCustomer.totalInstallments}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Down Payment:</span>{" "}
                            <span className="font-semibold">
                              PKR{" "}
                              {Number(
                                selectedCustomer.downPayment || 0,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">
                              Per Installment:
                            </span>{" "}
                            <span className="font-semibold">
                              PKR{" "}
                              {selectedCustomer.totalInstallments
                                ? Math.ceil(
                                    (selectedCustomer.totalPrice -
                                      (selectedCustomer.downPayment || 0)) /
                                      selectedCustomer.totalInstallments,
                                  ).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Structure */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Payment Structure
                  </label>
                  <select
                    name="paymentStructure"
                    value={form.paymentStructure}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed ${fieldErrors.paymentStructure ? "border-red-400" : "border-gray-200"}`}
                    disabled
                  >
                    <option value="">Select Payment Structure</option>
                    <option value="CASH">Cash</option>
                    <option value="INSTALLMENT">Installment</option>
                  </select>
                  <FieldError name="paymentStructure" />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Payment Method
                  </label>
                  <select
                    name="method"
                    value={form.method}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg ${fieldErrors.method ? "border-red-400" : "border-gray-200"}`}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                  <FieldError name="method" />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg ${fieldErrors.date ? "border-red-400" : "border-gray-200"}`}
                  />
                  <FieldError name="date" />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Amount (PKR)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    className={`w-full p-3 border rounded-lg ${fieldErrors.amount ? "border-red-400" : "border-gray-200"}`}
                  />
                  <FieldError name="amount" />
                </div>

                {/* Installment Number */}
                {form.paymentStructure === "INSTALLMENT" && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Installment Number
                    </label>
                    <input
                      type="number"
                      name="installmentNumber"
                      value={form.installmentNumber ?? ""}
                      onChange={handleChange}
                      placeholder={`Enter installment number (max ${selectedCustomer?.totalInstallments || "N/A"})`}
                      min={1}
                      max={selectedCustomer?.totalInstallments || undefined}
                      className={`w-full p-3 border rounded-lg ${fieldErrors.installmentNumber ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="installmentNumber" />
                    {selectedCustomer?.totalInstallments &&
                      !fieldErrors.installmentNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Installment number must be between 1 and{" "}
                          {selectedCustomer.totalInstallments}
                        </p>
                      )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editId
                      ? "Update Payment"
                      : "Save Payment"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-sm text-center">
              <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
              <p className="mb-6 text-gray-600">
                This payment will be permanently deleted.
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
                    if (deleteId) {
                      await handleDelete(deleteId);
                    }
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