"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Edit, Trash } from "lucide-react";
import PageLayout from "@/components/UI/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Progress } from "@/components/UI/progress";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
  CustomerFormData,
} from "@/lib/api";

const baseSchema = z.object({
  name: z
    .string()
    .min(1, "Please enter customer name")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only alphabets"),
  cnic: z
    .string()
    .min(1, "Please enter CNIC")
    .refine(
      (val) => val.replace(/-/g, "").length === 13,
      "Please enter a valid 13-digit CNIC",
    ),
  phone: z
    .string()
    .min(1, "Please enter phone number")
    .refine(
      (val) => val.replace(/-/g, "").length === 11,
      "Please enter a valid 11-digit phone number",
    ),
  address: z.string().min(1, "Please enter address"),
  plot: z.string().min(1, "Please enter plot number"),
  plotSize: z.string().min(1, "Please enter plot size"),
  plotType: z.string().min(1, "Please select plot type"),
  phase: z.string().min(1, "Please enter phase"),
  bookingDate: z.string().min(1, "Please select booking date"),
  paymentType: z.string().min(1, "Please select payment type"),
  totalPrice: z.number().min(1, "Please enter a valid total price"),
});

const cashSchema = baseSchema.extend({
  paymentType: z.literal("CASH"),
  totalInstallments: z.any().optional(),
  downPayment: z.any().optional(),
});

const installmentSchema = baseSchema
  .extend({
    paymentType: z.literal("INSTALLMENT"),
    totalInstallments: z
      .number({ error: "Please enter total installments" })
      .min(1, "Please enter total number of installments"),
    downPayment: z
      .number({ error: "Please enter down payment" })
      .min(0, "Please enter down payment amount"),
  })
  .refine((data) => data.downPayment < data.totalPrice, {
    message: "Down payment cannot be greater than or equal to total price",
    path: ["downPayment"],
  });

const customerFormSchema = z.discriminatedUnion("paymentType", [
  cashSchema,
  installmentSchema,
]);

type FieldErrors = Record<string, string>;

const initialFormData: CustomerFormData = {
  name: "",
  cnic: "",
  phone: "",
  address: "",
  plot: "",
  plotSize: "",
  plotType: "",
  phase: "",
  bookingDate: "",
  totalPrice: 0,
  paymentType: "",
  totalInstallments: undefined,
  downPayment: undefined,
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const [progress, setProgress] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    fetchCustomers();
  }, []);

  const fetchCustomers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await getAllCustomers();
      if (response.success) {
        setCustomers(response.data || []);
      } else {
        toast.error(response.message || "Failed to fetch customers");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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

    if (name === "cnic") {
      let digits = value.replace(/[^0-9]/g, "").slice(0, 13);
      let masked = digits;
      if (digits.length > 5)
        masked = digits.slice(0, 5) + "-" + digits.slice(5);
      if (digits.length > 12)
        masked =
          masked.slice(0, 5) +
          "-" +
          digits.slice(5, 12) +
          "-" +
          digits.slice(12);
      setFormData({ ...formData, cnic: masked });
      return;
    }

    if (name === "phone") {
      let digits = value.replace(/[^0-9]/g, "").slice(0, 11);
      let masked = digits;
      if (digits.length > 4)
        masked = digits.slice(0, 4) + "-" + digits.slice(4);
      setFormData({ ...formData, phone: masked });
      return;
    }

    if (name === "name") {
      const onlyAlphabets = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData({ ...formData, name: onlyAlphabets });
      return;
    }

    if (
      name === "totalInstallments" ||
      name === "downPayment" ||
      name === "totalPrice"
    ) {
      setFormData({
        ...formData,
        [name]:
          value === ""
            ? name === "totalPrice"
              ? 0
              : undefined
            : Number(value),
      });
      return;
    }

    if (name === "paymentType") {
      setFormData({
        ...formData,
        paymentType: value,
        totalInstallments:
          value === "INSTALLMENT" ? formData.totalInstallments : undefined,
        downPayment: value === "INSTALLMENT" ? formData.downPayment : undefined,
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const result = customerFormSchema.safeParse(formData);
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
      setSubmitting(false);
      return;
    }

    try {
      let response;
      const isEditing = !!editingId; // save this BEFORE resetting

      const submitData = {
        ...formData,
        cnic: formData.cnic.replace(/-/g, ""),
        phone: formData.phone.replace(/-/g, ""),
        totalPrice: Number(formData.totalPrice),
        totalInstallments:
          formData.paymentType === "INSTALLMENT"
            ? Number(formData.totalInstallments) || undefined
            : undefined,
        downPayment:
          formData.paymentType === "INSTALLMENT"
            ? Number(formData.downPayment) || undefined
            : undefined,
      };

      if (isEditing) {
        response = await updateCustomer(editingId!, submitData);
      } else {
        response = await createCustomer(submitData as any);
      }

      if (response.success) {
        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
        setFieldErrors({});
        toast.success(
          isEditing
            ? "Customer updated successfully!"
            : "Customer registered successfully!",
        );
        await fetchCustomers(false); // false = don't show loader, keep Toaster mounted
      } else {
        toast.error(response.message || "Operation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setFieldErrors({});
    setFormData({
      name: customer.name,
      cnic: customer.cnic,
      phone: customer.phone,
      address: customer.address,
      plot: customer.plot,
      plotSize: customer.plotSize,
      plotType: customer.plotType,
      phase: customer.phase,
      bookingDate: customer.bookingDate.split("T")[0],
      totalPrice: customer.totalPrice,
      paymentType: customer.paymentType || "CASH",
      totalInstallments: customer.totalInstallments,
      downPayment: customer.downPayment,
    });
    setEditingId(customer.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteCustomer(id);
      if (response.success) {
        setShowDeleteModal(false);
        setDeleteId(null);
        toast.success("Customer deleted successfully!");
        await fetchCustomers(false); // false = don't show loader
      } else {
        toast.error(response.message || "Failed to delete customer");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete customer",
      );
    }
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    setFieldErrors({});
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.cnic.includes(searchQuery) ||
      customer.plot.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
            Loading customers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout title="Customers">
        <Toaster position="top-center" richColors />

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Name, CNIC, or Plot #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={openAddModal}
              className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <span>+</span>
              <span>Register Customer</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  CNIC
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Plot
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Booking Date
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Total Price
                </th>
                <th className="text-left p-4 text-gray-500 font-medium text-sm uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="p-4 font-semibold text-gray-900">
                    {customer.name}
                  </td>
                  <td className="p-4 text-emerald-600 text-sm">
                    {customer.cnic}
                  </td>
                  <td className="p-4 text-emerald-600 text-sm">
                    {customer.phone}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {customer.plot}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {customer.phase}, {customer.plotType}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${customer.paymentType === "INSTALLMENT" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {customer.paymentType === "INSTALLMENT"
                        ? "Installment"
                        : "Cash"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {formatDate(customer.bookingDate)}
                  </td>
                  <td className="p-4 font-semibold text-gray-900">
                    PKR {customer.totalPrice.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(customer.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
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
                  className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
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

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No customers found
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl m-4">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Customer" : "New Customer Registration"}
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Muhammad Zaid"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.name ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="name" />
                  </div>

                  {/* CNIC */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      CNIC
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleInputChange}
                      placeholder="42101-XXXXXXX-X"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.cnic ? "border-red-400" : "border-gray-200"}`}
                      maxLength={15}
                    />
                    <FieldError name="cnic" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="03XX-XXXXXXX"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.phone ? "border-red-400" : "border-gray-200"}`}
                      maxLength={12}
                    />
                    <FieldError name="phone" />
                  </div>

                  {/* Booking Date */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Booking Date
                    </label>
                    <input
                      type="date"
                      name="bookingDate"
                      value={formData.bookingDate}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.bookingDate ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="bookingDate" />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${fieldErrors.address ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="address" />
                  </div>

                  {/* Plot */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Plot Number
                    </label>
                    <input
                      type="text"
                      name="plot"
                      value={formData.plot}
                      onChange={handleInputChange}
                      placeholder="e.g. P-12"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.plot ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="plot" />
                  </div>

                  {/* Plot Size */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Plot Size
                    </label>
                    <input
                      type="text"
                      name="plotSize"
                      value={formData.plotSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 5 Marla"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.plotSize ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="plotSize" />
                  </div>

                  {/* Plot Type */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Plot Type
                    </label>
                    <select
                      name="plotType"
                      value={formData.plotType}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${fieldErrors.plotType ? "border-red-400" : "border-gray-200"}`}
                    >
                      <option value="">Select Type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                    <FieldError name="plotType" />
                  </div>

                  {/* Phase */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Phase
                    </label>
                    <input
                      type="text"
                      name="phase"
                      value={formData.phase}
                      onChange={handleInputChange}
                      placeholder="e.g. Phase 1, Block A"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.phase ? "border-red-400" : "border-gray-200"}`}
                    />
                    <FieldError name="phase" />
                  </div>

                  {/* Payment Type */}
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Payment Type
                    </label>
                    <select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${fieldErrors.paymentType ? "border-red-400" : "border-gray-200"}`}
                    >
                      <option value="">Select Payment Type</option>
                      <option value="CASH">Cash (Full Payment)</option>
                      <option value="INSTALLMENT">Installment</option>
                    </select>
                    <FieldError name="paymentType" />
                  </div>

                  {/* CASH */}
                  {formData.paymentType === "CASH" && (
                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">
                        Total Agreed Price (PKR)
                      </label>
                      <input
                        type="number"
                        name="totalPrice"
                        value={formData.totalPrice || ""}
                        onChange={handleInputChange}
                        placeholder="Enter total price"
                        min={0}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.totalPrice ? "border-red-400" : "border-gray-200"}`}
                      />
                      <FieldError name="totalPrice" />
                      {formData.totalPrice > 0 && (
                        <div className="mt-3 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                          <p className="text-emerald-700 font-semibold text-lg">
                            Total Amount: PKR{" "}
                            {Number(formData.totalPrice).toLocaleString()}
                          </p>
                          <p className="text-emerald-600 text-sm mt-1">
                            Customer will pay full amount in cash.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INSTALLMENT */}
                  {formData.paymentType === "INSTALLMENT" && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-gray-700 font-medium mb-2">
                          Total Agreed Price (PKR)
                        </label>
                        <input
                          type="number"
                          name="totalPrice"
                          value={formData.totalPrice || ""}
                          onChange={handleInputChange}
                          placeholder="Enter total price"
                          min={0}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.totalPrice ? "border-red-400" : "border-gray-200"}`}
                        />
                        <FieldError name="totalPrice" />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Down Payment (PKR)
                        </label>
                        <input
                          type="number"
                          name="downPayment"
                          value={formData.downPayment ?? ""}
                          onChange={handleInputChange}
                          placeholder="e.g. 500000"
                          min={0}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.downPayment ? "border-red-400" : "border-gray-200"}`}
                        />
                        <FieldError name="downPayment" />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Total Number of Installments
                        </label>
                        <input
                          type="number"
                          name="totalInstallments"
                          value={formData.totalInstallments ?? ""}
                          onChange={handleInputChange}
                          placeholder="e.g. 36"
                          min={1}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${fieldErrors.totalInstallments ? "border-red-400" : "border-gray-200"}`}
                        />
                        <FieldError name="totalInstallments" />
                      </div>

                      {formData.totalPrice > 0 &&
                        formData.totalInstallments &&
                        formData.totalInstallments > 0 && (
                          <div className="col-span-2 bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <h4 className="text-blue-800 font-semibold mb-3">
                              Payment Summary
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-blue-600 text-xs font-medium">
                                  Total Price
                                </p>
                                <p className="text-blue-900 font-bold text-lg">
                                  PKR{" "}
                                  {Number(formData.totalPrice).toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-blue-600 text-xs font-medium">
                                  Down Payment
                                </p>
                                <p className="text-blue-900 font-bold text-lg">
                                  PKR{" "}
                                  {Number(
                                    formData.downPayment || 0,
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-blue-600 text-xs font-medium">
                                  Per Installment
                                </p>
                                <p className="text-blue-900 font-bold text-lg">
                                  PKR{" "}
                                  {Math.ceil(
                                    (formData.totalPrice -
                                      (formData.downPayment || 0)) /
                                      formData.totalInstallments,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-blue-600 text-sm mt-3 text-center">
                              {formData.totalInstallments} installments of PKR{" "}
                              {Math.ceil(
                                (formData.totalPrice -
                                  (formData.downPayment || 0)) /
                                  formData.totalInstallments,
                              ).toLocaleString()}{" "}
                              each after down payment
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as any)}
                    disabled={submitting}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                        ? "Update Customer"
                        : "Save Customer"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-lg min-w-75">
              <h2 className="text-lg font-bold mb-4">Delete Customer</h2>
              <p className="mb-6">
                Do you want to delete this customer? All linked payments will
                also be deleted.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteId) {
                      await handleDelete(deleteId);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
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
