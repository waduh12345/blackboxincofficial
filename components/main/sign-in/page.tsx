// components/auth/LoginPage.tsx
"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Heart,
  User,
  Phone,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Award, // Ikon baru untuk fashion
  Ruler, // Ikon baru untuk fashion
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
// import { useRegisterMutation } from "@/services/auth.service"; // Dibiarkan sebagai mock
import { Button } from "@/components/ui/button"; // Asumsi Button sudah B&W
import clsx from "clsx";

// --- Mocking Unused Hooks for UI isolation ---
type RegisterSuccess = { message?: string };
type TriggerReturn<T> = Promise<T> & { unwrap: () => Promise<T> };

const useRegisterMutation = () => {
  const trigger = (
    payload: RegisterPayload
  ): TriggerReturn<RegisterSuccess> => {
    const p = new Promise<RegisterSuccess>((resolve) => {
      setTimeout(() => resolve({ message: "ok" }), 1000);
    }) as TriggerReturn<RegisterSuccess>;
    p.unwrap = () => p;
    return p;
  };
  return [trigger, { isLoading: false }] as const;
};
// --- End Mock ---

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

interface ForgotPasswordData {
  email: string;
}

interface OtpFormData {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showOtpForm, setShowOtpForm] = useState<boolean>(false);

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [forgotPasswordData, setForgotPasswordData] =
    useState<ForgotPasswordData>({
      email: "",
    });

  const [otpFormData, setOtpFormData] = useState<OtpFormData>({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [isSendingResetLink, setIsSendingResetLink] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [registerMutation, { isLoading: isRegistering }] =
    useRegisterMutation();

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // ===== Handlers (Logic remains the same) =====
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    const newErrors: string[] = [];
    if (!loginData.email) newErrors.push("Email wajib diisi");
    if (!loginData.password) newErrors.push("Password wajib diisi");
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });

      if (res?.ok) {
        setSuccessMsg("Berhasil masuk. Mengarahkan…");
        router.push("/me");
      } else {
        setErrors(["Gagal masuk. Email atau password salah."]);
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors(["Login gagal. Cek kembali email dan password."]);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    const newErrors: string[] = [];
    if (!registerData.fullName) newErrors.push("Nama lengkap wajib diisi");
    if (!registerData.email) newErrors.push("Email wajib diisi");
    if (!registerData.phone) newErrors.push("Nomor telepon wajib diisi");
    if (!registerData.password) newErrors.push("Password wajib diisi");
    if (registerData.password !== registerData.confirmPassword)
      newErrors.push("Konfirmasi password tidak sesuai");
    if (!registerData.agreeToTerms)
      newErrors.push("Anda harus menyetujui syarat dan ketentuan");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: RegisterPayload = {
      name: registerData.fullName,
      email: registerData.email,
      phone: registerData.phone,
      password: registerData.password,
      password_confirmation: registerData.confirmPassword,
    };

    try {
      await registerMutation(payload).unwrap(); // ✔ tanpa any
      setSuccessMsg("Registrasi berhasil! Silakan masuk.");
      setLoginData((p) => ({ ...p, email: registerData.email }));
      setIsLogin(true);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      const msg = apiErr?.data?.message ?? "Registrasi gagal. Coba lagi.";
      setErrors([msg]);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    if (!forgotPasswordData.email) {
      setErrors(["Email wajib diisi"]);
      return;
    }

    setIsSendingResetLink(true);
    try {
      // API call placeholder
      const response = { ok: true, json: () => ({}) }; // Mock success

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(
          "Jika email terdaftar, kode reset password akan dikirimkan. Silakan periksa email Anda dan masukkan kode di bawah."
        );
        setOtpFormData((prev) => ({
          ...prev,
          email: forgotPasswordData.email,
        }));
        setShowForgotPassword(false);
        setShowOtpForm(true);
      } else {
        const message =
          (data as { message?: string }).message ||
          "Gagal mengirim tautan reset password. Silakan coba lagi.";
        setErrors([message]);
      }
    } catch (err) {
      setErrors(["Terjadi kesalahan saat mengirim permintaan."]);
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    const { email, otp, password, confirmPassword } = otpFormData;

    const newErrors: string[] = [];
    if (!otp) newErrors.push("Kode OTP wajib diisi");
    if (!password) newErrors.push("Password baru wajib diisi");
    if (password.length < 8) newErrors.push("Password minimal 8 karakter");
    if (password !== confirmPassword)
      newErrors.push("Konfirmasi password tidak sesuai");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsVerifyingOtp(true);
    try {
      // API call placeholder
      const response = { ok: true, json: () => ({}) }; // Mock success

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(
          "Password berhasil diubah. Silakan masuk dengan password baru Anda."
        );
        setShowOtpForm(false);
        setIsLogin(true);
        setLoginData((prev) => ({ ...prev, email }));
      } else {
        const message =
          (data as { message?: string }).message || "Gagal mengubah password. Pastikan kode OTP benar.";
        setErrors([message]);
      }
    } catch (err) {
      setErrors(["Terjadi kesalahan saat memvalidasi OTP."]);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ===== UI (B&W Styling) =====
  const primaryColor = "text-black";
  const accentBg = "bg-black";
  const accentText = "text-white";
  const errorColor = "text-red-600";
  const successColor = "text-emerald-600";

  // --- Forgot Password Form ---
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${accentBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-black mb-2 uppercase">
              Forgot Password?
            </h2>
            <p className="text-gray-700">
              {`Enter your email and we'll guide you through the process.`}
            </p>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Error:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotPasswordData.email}
                  onChange={(e) =>
                    setForgotPasswordData({ email: e.target.value })
                  }
                  // Input B&W Styling
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setErrors([]);
                  setSuccessMsg(null);
                }}
                // Button Secondary B&W
                className="flex-1 py-4 border border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingResetLink}
                // Button Primary B&W
                className={clsx(
                  "flex-1 text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider",
                  accentBg
                )}
              >
                {isSendingResetLink ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Link"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } else if (showOtpForm) {
    // --- OTP Form ---
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${accentBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-black mb-2 uppercase">
              Verify & Reset Password
            </h2>
            <p className="text-gray-700">
              Enter the OTP sent to your email and set a new password.
            </p>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Error:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase">
                OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={otpFormData.otp}
                  onChange={(e) =>
                    setOtpFormData((prev) => ({ ...prev, otp: e.target.value }))
                  }
                  // Input B&W Styling
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-center font-bold text-lg tracking-[0.25em] text-black"
                  placeholder="------"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={otpFormData.password}
                  onChange={(e) =>
                    setOtpFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  // Input B&W Styling
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={otpFormData.confirmPassword}
                  onChange={(e) =>
                    setOtpFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  // Input B&W Styling
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                  placeholder="Repeat new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowOtpForm(false);
                  setShowForgotPassword(true);
                  setErrors([]);
                  setSuccessMsg(null);
                }}
                // Button Secondary B&W
                className="flex-1 py-4 border border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isVerifyingOtp}
                // Button Primary B&W
                className={clsx(
                  "flex-1 text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider",
                  accentBg
                )}
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Login/Register Main UI ---
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Subtle B&W Background Dots/Bubbles */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-black/10 rounded-full opacity-60 animate-pulse" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-gray-600/10 rounded-full opacity-60 animate-pulse delay-1000" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Left Sidebar (Inverted B&W) */}
        <div
          className={`${accentBg} p-8 lg:p-12 flex flex-col justify-center text-white relative overflow-hidden`}
        >
          {/* Subtle Accent Shapes B&W */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full" />
          </div>

          <div className="relative z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              // Button B&W Inverted
              className="text-black cursor-pointer shadow-lg border-white bg-white hover:bg-gray-100 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Store
            </Button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-extrabold text-xl tracking-wider">
                  B
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white uppercase">
                  BLACKBOX.INC
                </h1>
                <p className="text-white/80 text-sm">Exclusive Fashion</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight text-white uppercase">
                {isLogin
                  ? "Welcome Back, Define Your Style."
                  : "Join The Exclusive Circle."}
              </h2>
              <p className="text-white/80 text-lg">
                {isLogin
                  ? "Sign in to access your collection, track orders, and manage your profile."
                  : "Register now to enjoy premium designs, early access, and unparalleled quality."}
              </p>
            </div>

            {/* Feature List (Fashion Focus) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-white" />
                <span className="text-white/80">Uncompromising Quality</span>
              </div>
              <div className="flex items-center gap-3">
                <Ruler className="w-6 h-6 text-white" />
                <span className="text-white/80">Perfect Fit Guarantee</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-white" />
                <span className="text-white/80">Timeless, Minimal Design</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.9</div>
                <div className="text-white/50 text-sm">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-white/50 text-sm">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Exclusive</div>
                <div className="text-white/50 text-sm">New Drops Weekly</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Area (Standard B&W) */}
        <div className="p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black uppercase">
                  {isLogin ? "Client Sign In" : "New Client"}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2 uppercase">
                {isLogin ? "Access Your Account" : "Create New Account"}
              </h3>
              <p className="text-gray-700">
                {isLogin
                  ? "Enter your credentials to continue"
                  : "Fill in the details below to join BLACKBOX.INC"}
              </p>
            </div>

            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Error:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error) => (
                        <li key={error}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                {successMsg}
              </div>
            )}

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="name@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setErrors([]);
                      setSuccessMsg(null);
                      setForgotPasswordData({ email: loginData.email });
                    }}
                    className="text-black font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  // Button Primary B&W
                  className={clsx(
                    "w-full text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider",
                    accentBg
                  )}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Register Form
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.fullName}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="name@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      // Input B&W Styling
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={registerData.agreeToTerms}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        agreeToTerms: e.target.checked,
                      }))
                    }
                    // Checkbox B&W Styling
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black mt-1"
                  />
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="text-black hover:underline font-semibold"
                    >
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-black hover:underline font-semibold"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  // Button Primary B&W
                  className={clsx(
                    "w-full text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider",
                    accentBg
                  )}
                >
                  {isRegistering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Sign Up Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-700">
                {isLogin ? "New client?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsLogin((v) => !v);
                    setErrors([]);
                    setSuccessMsg(null);
                  }}
                  className="text-black font-semibold hover:underline"
                >
                  {isLogin ? "Register here" : "Sign in here"}
                </button>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-black" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-black" />
                  <span>Data Protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}