"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import Swal from "sweetalert2";

import { useAuthLoginMutation } from "@/services/customize/auth.service";
import { fredoka, sniglet } from "@/lib/fonts";

interface ApiError {
  data?: {
    message?: string;
  };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [authLogin, { isLoading }] = useAuthLoginMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrorMsg("Silakan isi email dan kata sandi Anda.");
      return;
    }

    try {
      // 1. Request Login
      const response = await authLogin(formData).unwrap();

      if (response.success && response.data) {
        // ✅ SIMPAN TOKEN (Sync)
        localStorage.setItem("token", response.data.token);
        // localStorage.setItem("code_client", response.data.code_client);
        localStorage.setItem(
          "code_client",
          "$2b$10$YhXgOcShXgAahAbg3bElA.PTrNExk/3xeA9M47figAuJjiuE.05o."
        );

        console.log("✅ Token saved manually in Login Page");

        await Swal.fire({
          icon: "success",
          title: "Berhasil Masuk!",
          text: "Selamat datang kembali di COLORE.",
          confirmButtonColor: "#E84A8A",
          timer: 1500,
          showConfirmButton: false,
          backdrop: `rgba(232, 74, 138, 0.1)`, // Efek backdrop pink transparan
        });

        // 2. Redirect setelah token tersimpan
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl) {
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push("/customize/client");
        }
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const apiErr = err as ApiError;
      setErrorMsg(
        apiErr?.data?.message || "Gagal masuk. Periksa kembali kredensial Anda."
      );
    }
  };

  return (
    <div
      className={`py-8 min-h-screen w-full flex items-center justify-center bg-[#E0F2E9] relative overflow-hidden ${sniglet.className}`}
    >
      {/* --- CSS Animasi Tambahan (Inline) --- */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-float-slow {
          animation: float 15s infinite ease-in-out;
        }
        .animate-float-medium {
          animation: float 10s infinite ease-in-out reverse;
        }
        .animate-float-fast {
          animation: float 8s infinite ease-in-out;
        }
      `}</style>

      {/* --- Elemen Dekoratif Bergerak --- */}
      {/* Pink Blob */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-[#E84A8A]/30 rounded-full blur-[100px] animate-float-slow pointer-events-none mix-blend-multiply"></div>
      {/* Green Blob */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2D8A6E]/20 rounded-full blur-[120px] animate-float-medium pointer-events-none mix-blend-multiply"></div>
      {/* Yellow/Accent Blob */}
      <div className="absolute top-[30%] right-[20%] w-64 h-64 bg-yellow-300/40 rounded-full blur-[80px] animate-float-fast pointer-events-none mix-blend-multiply"></div>

      {/* --- Kartu Login Glassmorphism --- */}
      <div className="relative bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] max-h-[90vh] shadow-2xl w-full max-w-md mx-4 border border-white/60 ring-1 ring-white/50 transform transition-all hover:scale-[1.01] duration-500">
        {/* Header Kartu */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-white to-[#E84A8A]/10 p-4 rounded-3xl mb-5 shadow-sm border border-white/50">
            <Sparkles className="w-10 h-10 text-[#E84A8A] drop-shadow-sm" />
          </div>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50/80 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-shake shadow-sm backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold">Oops!</span> {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Email */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#E84A8A] group-focus-within:scale-110 transition-all duration-300">
              <Mail className="h-6 w-6" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Alamat Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-14 pr-6 py-5 bg-white/60 border-2 border-transparent hover:border-[#E84A8A]/30 rounded-2xl focus:outline-none focus:border-[#E84A8A] focus:bg-white focus:ring-4 focus:ring-[#E84A8A]/10 transition-all duration-300 text-[#1A1A2E] font-semibold placeholder-gray-400 shadow-sm"
              required
            />
          </div>

          {/* Input Password */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#E84A8A] group-focus-within:scale-110 transition-all duration-300">
              <Lock className="h-6 w-6" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Kata Sandi"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-14 pr-14 py-5 bg-white/60 border-2 border-transparent hover:border-[#E84A8A]/30 rounded-2xl focus:outline-none focus:border-[#E84A8A] focus:bg-white focus:ring-4 focus:ring-[#E84A8A]/10 transition-all duration-300 text-[#1A1A2E] font-semibold placeholder-gray-400 shadow-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#E84A8A] hover:bg-[#E84A8A]/10 p-2 rounded-full transition-all duration-300 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Link Lupa Password */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-[#2D8A6E] hover:text-[#E84A8A] hover:underline decoration-2 underline-offset-4 transition-colors font-bold tracking-wide"
            >
              Lupa kata sandi?
            </Link>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#E84A8A] to-[#D63D7A] hover:from-[#D63D7A] hover:to-[#C03565] text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-[#E84A8A]/30 hover:shadow-xl hover:shadow-[#E84A8A]/40 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="animate-pulse">Memproses...</span>
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                Masuk Sekarang
              </>
            )}
          </button>
        </form>

        {/* Footer Link Register */}
        <div className="mt-4 text-center text-gray-500 font-medium">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-[#E84A8A] font-extrabold hover:text-[#D63D7A] hover:underline decoration-2 underline-offset-4 transition-all ml-1"
          >
            Daftar Yuk!
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#E0F2E9] animate-pulse" />}
    >
      <LoginContent />
    </Suspense>
  );
}