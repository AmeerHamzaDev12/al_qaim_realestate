"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { X, Search, BookOpen, Edit, Trash } from "lucide-react";
import PageLayout from "@/components/UI/PageLayout";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
  CustomerFormData,
} from "@/lib/api";

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
  totalPrice: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getAllCustomers();
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let response;
      const dataToSend = {
        ...formData,
        cnic: formData.cnic.replace(/-/g, ""),
        phone: formData.phone.replace(/-/g, ""),
        totalPrice: Number(formData.totalPrice),
      };
      if (editingId) {
        response = await updateCustomer(editingId, {
          ...formData,
          cnic: formData.cnic.replace(/-/g, ""),
          phone: formData.phone.replace(/-/g, ""),
        });
      } else {
        response = await createCustomer({
          ...formData,
          cnic: formData.cnic.replace(/-/g, ""),
          phone: formData.phone.replace(/-/g, ""),
          totalPrice: Number(formData.totalPrice),
        } as any);
      }
      if (response.success) {
        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
        fetchCustomers();
      } else {
        setError(response.message || "Operation failed");
      }
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
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
      totalPrice: customer.totalPrice.toString(),
    });
    setEditingId(customer.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      await deleteCustomer(id);
      fetchCustomers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete customer");
    }
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setEditingId(null);
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout title="Customers">
      {" "}
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
            className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium"
          >
            <span>+</span>
            <span>Register Customer</span>
          </button>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      {/* Customers Table */}
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
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
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
                <td className="p-4 text-gray-600">
                  {formatDate(customer.bookingDate)}
                </td>
                <td className="p-4 font-semibold text-gray-900">
                  PKR {customer.totalPrice.toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(customer.id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No customers found
          </div>
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl m-4">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Customer" : "New Customer Registration"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-6">
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={15}
                    required
                  />
                </div>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={12}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    required
                  />
                </div>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Plot Type
                  </label>
                  <select
                    name="plotType"
                    value={formData.plotType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Total Agreed Price
                  </label>
                  <input
                    type="number"
                    name="totalPrice"
                    value={formData.totalPrice}
                    onChange={handleInputChange}
                    placeholder="PKR"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
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
                  className="px-8 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg min-w-75">
            <h2 className="text-lg font-bold mb-4">Delete Customer</h2>
            <p className="mb-6">Do you want to delete the customer?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteId) {
                    await handleDelete(deleteId);
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sure
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
