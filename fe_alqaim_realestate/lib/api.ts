"use client";
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

  if (data.token) {
    localStorage.setItem("authToken", data.token);
  }

  return data;
}