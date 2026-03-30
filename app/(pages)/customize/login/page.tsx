"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import Swal from "sweetalert2";

import { useAuthLoginMutation } from "@/services/customize/auth.service";
import { sniglet } from "@/lib/fonts";

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
        localStorage.setItem(
          "code_client",
          "$2b$10$OQn8T3wDmOw4pDZz.jPC4ONpoheZvpx9eReWIajaggH/aZDkU1koC"
        );

        console.log("✅ Token saved manually in Login Page");

        // ✅ SweetAlert Tema Monokrom
        await Swal.fire({
          icon: "success",
          title: "Berhasil Masuk!",
          text: "Selamat datang kembali di COLORE.",
          confirmButtonColor: "#000000", // Tombol Hitam
          iconColor: "#000000", // Ikon Hitam
          background: "#ffffff", // Background Putih Bersih
          color: "#000000", // Teks Hitam
          timer: 1500,
          showConfirmButton: false,
          backdrop: `rgba(0, 0, 0, 0.4)`, // Backdrop gelap transparan
          customClass: {
            popup: "border border-zinc-200 shadow-2xl rounded-2xl",
          },
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
      className={`py-8 min-h-screen w-full flex items-center justify-center bg-zinc-50 relative overflow-hidden ${sniglet.className}`}
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

        /* Custom Shake Animation for Error */
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {/* --- Elemen Dekoratif Bergerak (Monokrom) --- */}
      {/* Dark Gray Blob */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-zinc-300/40 rounded-full blur-[80px] animate-float-slow pointer-events-none"></div>
      {/* Black Accent Blob */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-black/5 rounded-full blur-[100px] animate-float-medium pointer-events-none"></div>
      {/* Light Gray Blob */}
      <div className="absolute top-[30%] right-[20%] w-64 h-64 bg-zinc-200/50 rounded-full blur-[60px] animate-float-fast pointer-events-none"></div>

      {/* --- Kartu Login Glassmorphism --- */}
      <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] max-h-[90vh] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md mx-4 border border-white ring-1 ring-zinc-100 transform transition-all hover:scale-[1.005] duration-500">
        {/* Header Kartu */}
        <div className="text-center mb-2">
          {/* Ikon Header: Hitam Solid dengan Icon Putih */}
          <div className="inline-flex items-center justify-center bg-black p-4 rounded-2xl mb-5 shadow-lg shadow-zinc-300 transform rotate-3 hover:rotate-0 transition-all duration-300">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-1">
            Selamat Datang
          </h2>
          <p className="text-zinc-500 text-sm">
            Masuk untuk melanjutkan kustomisasi
          </p>
        </div>

        {/* Alert Error (Monokrom Merah Gelap/Hitam) */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm flex items-center gap-3 animate-shake shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold">Oops!</span> {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Email */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-zinc-400 group-focus-within:text-black group-focus-within:scale-110 transition-all duration-300">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Alamat Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all duration-300 text-zinc-900 font-medium placeholder-zinc-400"
              required
            />
          </div>

          {/* Input Password */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-zinc-400 group-focus-within:text-black group-focus-within:scale-110 transition-all duration-300">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Kata Sandi"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-12 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all duration-300 text-zinc-900 font-medium placeholder-zinc-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-black p-1 rounded-full transition-all duration-300 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Link Lupa Password */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-black hover:underline decoration-1 underline-offset-4 transition-colors font-semibold tracking-wide"
            >
              Lupa kata sandi?
            </Link>
          </div>

          {/* Tombol Submit (Hitam Solid) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-zinc-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-zinc-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="animate-pulse">Memproses...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Footer Link Register */}
        <div className="mt-6 text-center text-zinc-500 text-sm font-medium">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-black font-extrabold hover:underline decoration-2 underline-offset-4 transition-all ml-1"
          >
            Daftar Disini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-zinc-50 animate-pulse" />}
    >
      <LoginContent />
    </Suspense>
  );
}