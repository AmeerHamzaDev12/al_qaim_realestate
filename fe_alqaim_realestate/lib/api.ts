"use client";

export interface Customer {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  address: string;
  plot: string;
  plotSize: string;
  plotType: string;
  phase: string;
  bookingDate: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  cnic: string;
  phone: string;
  address: string;
  plot: string;
  plotSize: string;
  plotType: string;
  phase: string;
  bookingDate: string;
  totalPrice: number;
}

export interface Payment {
  id: string;
  receipt: string;
  customerId: string;
  customer: Customer;
  method: string;
  date: string;
  amount: number;
}

export interface PaymentFormData {
  customerId: string;
  method: string;
  date: string;
  amount: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  plotsSold: number;
  collectedAmount: number;
  outstandingBalance: number;
  totalPayments: number;
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...userData,
        role: "user",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        isSuccess: true,
        success: true,
        message: data.message || "Account created successfully!",
        data: data,
      };
    }
    let errorMessage = "Registration failed";

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      errorMessage = data.errors
        .map((err: any) => err.description || err.message || "Unknown error")
        .join(". ");
    } else if (data.message) {
      errorMessage = data.message;
    } else if (data.title) {
      errorMessage = data.title;
    }

    return {
      isSuccess: false,
      success: false,
      message: errorMessage,
      status: res.status,
      data: data,
    };
  } catch (error: any) {
    console.error("registerUser catch error:", error);

    return {
      isSuccess: false,
      success: false,
      message: error.message || "Failed to register. Please try again.",
      error: error,
    };
  }
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getAllCustomers() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        data: data.data,
        count: data.count,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to fetch customers",
    };
  } catch (error: any) {
    console.error("getAllCustomers error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch customers",
    };
  }
}

export async function getCustomerById(id: string) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to fetch customer",
    };
  } catch (error: any) {
    console.error("getCustomerById error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch customer",
    };
  }
}

export async function createCustomer(customerData: CustomerFormData) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || "Customer created successfully",
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to create customer",
      data: data.data,
    };
  } catch (error: any) {
    console.error("createCustomer error:", error);
    return {
      success: false,
      message: error.message || "Failed to create customer",
    };
  }
}

export async function updateCustomer(id: string, customerData: Partial<CustomerFormData>) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || "Customer updated successfully",
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to update customer",
    };
  } catch (error: any) {
    console.error("updateCustomer error:", error);
    return {
      success: false,
      message: error.message || "Failed to update customer",
    };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}customers/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || "Customer deleted successfully",
      };
    }

    return {
      success: false,
      message: data.message || "Failed to delete customer",
    };
  } catch (error: any) {
    console.error("deleteCustomer error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete customer",
    };
  }
}

export async function getAllPayments() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to fetch payments",
    };
  } catch (error: any) {
    console.error("getAllPayments error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch payments",
    };
  }
}

export async function getPaymentById(id: string) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to fetch payment",
    };
  } catch (error: any) {
    console.error("getPaymentById error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch payment",
    };
  }
}

export async function addPayment(paymentData: PaymentFormData) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || "Payment added successfully",
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to add payment",
      data: data.data,
    };
  } catch (error: any) {
    console.error("addPayment error:", error);
    return {
      success: false,
      message: error.message || "Failed to add payment",
    };
  }
}

export async function updatePayment(id: string, paymentData: Partial<PaymentFormData>) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: data.message || "Payment updated successfully",
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to update payment",
    };
  } catch (error: any) {
    console.error("updatePayment error:", error);
    return {
      success: false,
      message: error.message || "Failed to update payment",
    };
  }
}

export async function downloadReceipt(id: string) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/receipt/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const data = await res.json();
      return {
        success: false,
        message: data.message || "Failed to download receipt",
      };
    }
    const blob = await res.blob();
    return {
      success: true,
      blob,
    };
  } catch (error: any) {
    console.error("downloadReceipt error:", error);
    return {
      success: false,
      message: error.message || "Failed to download receipt",
    };
  }
}

export async function deletePayment(id: string) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || "Deleted" };
    }
    return { success: false, message: data.message || "Failed to delete" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete" };
  }
}

export async function getDashboardSummary() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}dashboard/summary`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, data: data.data as DashboardSummary };
    }
    return { success: false, message: data.message || "Failed to fetch summary" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to fetch summary" };
  }
}

export async function getWeeklyCollectionSummary() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}dashboard/weekly-collection`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await res.json();
    if (res.ok && data.success) return { success: true, data: data.data };
    return { success: false, message: data.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getRecentPayments() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}dashboard/recent-payments`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await res.json();
    if (res.ok && data.success) return { success: true, data: data.data };
    return { success: false, message: data.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}