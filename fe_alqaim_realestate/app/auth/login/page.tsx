"use client";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";

const ItemsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
});

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = ItemsSchema.safeParse(form);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        if (field && !errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);

    try {
      const response = await loginUser(form.email, form.password);

      if (response.success) {
        toast.success(response.message);
        login(response.data.token);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <Toaster position="top-center" richColors />

      <div className="absolute top-0 right-0 w-125 h-125 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10">
        {/* Header */}
        <div className="bg-emerald-600 p-8 text-white text-center">
          <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight leading-none">
            Al-Qaim
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-80 mb-1">
            Associates & Builders
          </p>
          <p className="text-emerald-100/70 text-[10px] mt-2 border-t border-emerald-500/30 pt-2">
            Login to your Account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-10 space-y-5" noValidate>
          {Object.keys(fieldErrors).length > 0 && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Please fix the errors below
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 placeholder:text-slate-400 ${
                  fieldErrors.email
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                }`}
                placeholder="you@example.com"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="new-password"
                className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 placeholder:text-slate-400 appearance-none ${
                  fieldErrors.password
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors z-10"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {fieldErrors.password}
              </p>
            )}
          </div>


          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>

          {/* Footer */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-sm text-slate-600">
              Don't have an Account?{" "}
              <Link
                href="/auth/register"
                className="text-emerald-600 font-bold hover:underline"
              >
                Register
              </Link>
            </p>
            <p className="text-[10px] text-slate-400 font-medium italic">
              Contact System Admin for account issues.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
