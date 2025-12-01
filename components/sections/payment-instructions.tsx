"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import {
  CreditCard,
  Smartphone,
  Building2,
  MonitorCheck,
  ChevronRight,
  Copy,
  Store, // Icon untuk Retail
} from "lucide-react";
import clsx from "clsx";

// DATA METODE PEMBAYARAN LENGKAP
const PAYMENT_METHODS_DATA = [
  {
    id: "transfer",
    label: "Transfer Bank (Manual)",
    icon: <Building2 className="w-5 h-5" />,
    description: "Transfer manual ke rekening BCA/Mandiri & Upload Bukti.",
    steps: [
      "Masuk ke Mobile Banking atau ATM Anda.",
      "Pilih menu 'Transfer Antar Rekening' atau 'Antar Bank'.",
      "Masukkan Nomor Rekening BCA: 123-456-7890 a/n BLACKBOX INC.",
      "Masukkan nominal sesuai Total Tagihan (pastikan digit terakhir sesuai).",
      "Simpan bukti transfer/struk.",
      "Upload bukti pembayaran melalui link yang dikirim ke email atau halaman 'Riwayat Pesanan'.",
      "Konfirmasi manual akan diproses dalam 1x24 jam.",
    ],
  },
  {
    id: "va",
    label: "Virtual Account (Otomatis)",
    icon: <MonitorCheck className="w-5 h-5" />,
    description: "BCA, Mandiri, BNI, BRI, Permata (Cek Otomatis by DOKU).",
    steps: [
      "Pilih Bank untuk Virtual Account (VA) pada saat checkout.",
      "Salin 'Nomor Virtual Account' yang muncul (Contoh: 8888xxxxxxxx).",
      "Buka M-Banking/ATM, pilih menu 'Pembayaran' > 'Virtual Account'.",
      "Masukkan Nomor VA tersebut.",
      "Periksa nama tagihan (biasanya 'DOKU' atau 'BLACKBOX MERCH').",
      "Konfirmasi pembayaran dengan PIN.",
      "Selesai! Pembayaran terverifikasi otomatis tanpa perlu upload bukti.",
    ],
  },
  {
    id: "ewallet",
    label: "QRIS & E-Wallet",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Scan QRIS pakai GoPay, OVO, ShopeePay, DANA.",
    steps: [
      "Pilih metode QRIS / E-Wallet di checkout.",
      "Kode QRIS Dynamic akan muncul di layar.",
      "Buka aplikasi E-Wallet (GoPay, OVO, Dana, ShopeePay).",
      "Pilih menu 'Scan/Bayar'.",
      "Arahkan kamera ke QRIS di layar.",
      "Cek nominal dan masukkan PIN.",
      "Pembayaran berhasil terverifikasi secara instan.",
    ],
  },
  {
    id: "retail",
    label: "Alfamart / Indomaret",
    icon: <Store className="w-5 h-5" />,
    description: "Bayar tunai di kasir minimarket terdekat.",
    steps: [
      "Pilih metode 'Gerai Retail' (Alfamart/Indomaret).",
      "Klik 'Get Payment Code' untuk mendapatkan Kode Pembayaran.",
      "Datang ke gerai terdekat dan menuju kasir.",
      "Infokan ingin membayar tagihan 'DOKU' atau merchant terkait.",
      "Tunjukkan Kode Pembayaran.",
      "Bayar sesuai nominal dan simpan struk sebagai bukti sah.",
    ],
  },
  {
    id: "cc",
    label: "Credit Card",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Visa, Mastercard, JCB (Cicilan/Full Payment).",
    steps: [
      "Pilih Kartu Kredit pada halaman pembayaran.",
      "Masukkan 16 digit Nomor Kartu, Masa Berlaku, dan CVV.",
      "Pastikan kartu aktif untuk transaksi online (3D Secure).",
      "Klik 'Bayar'. Anda akan diarahkan ke halaman OTP Bank.",
      "Masukkan kode OTP yang masuk via SMS.",
      "Transaksi selesai.",
    ],
  },
];

export function PaymentInstructions() {
  const [activeTab, setActiveTab] = useState("transfer"); // Default ke Transfer Manual

  const activeData = PAYMENT_METHODS_DATA.find((p) => p.id === activeTab);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    Toast.fire({
      icon: "success",
      title: "Disalin ke clipboard!",
      background: "#000",
      color: "#fff",
      iconColor: "#fff",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-12">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-black uppercase tracking-wider">
          Panduan Pembayaran
        </h3>
        <p className="text-gray-600 mt-2">
          Pilih metode pembayaran untuk melihat instruksi lengkap.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* --- LEFT: NAVIGATION --- */}
        <div className="w-full md:w-1/3 flex flex-col gap-2">
          {PAYMENT_METHODS_DATA.map((method) => (
            <button
              key={method.id}
              onClick={() => setActiveTab(method.id)}
              className={clsx(
                "group flex items-center gap-3 px-5 py-4 rounded-lg text-left transition-all duration-200 border",
                activeTab === method.id
                  ? "bg-black text-white border-black shadow-lg translate-x-1"
                  : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
              )}
            >
              <div
                className={clsx(
                  "p-2 rounded-md transition-colors",
                  activeTab === method.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-black"
                )}
              >
                {method.icon}
              </div>
              <div className="flex-1">
                <span className="block font-bold text-sm uppercase tracking-wide">
                  {method.label}
                </span>
              </div>
              {activeTab === method.id && (
                <ChevronRight className="w-4 h-4 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* --- RIGHT: CONTENT --- */}
        <div className="w-full md:w-2/3">
          {activeData && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 h-full shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-xl font-bold text-black flex items-center gap-2">
                  {activeData.label}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {activeData.description}
                </p>
              </div>

              <div className="space-y-4">
                {activeData.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed flex-1">
                      {/* LOGIC COPY PASTE UNTUK REKENING MANUAL */}
                      {step.includes("123-456-7890") ? (
                        <span className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span>Masukkan Nomor Rekening BCA:</span>
                          <code className="bg-gray-200 px-2 py-0.5 rounded text-black font-mono font-bold flex items-center gap-2 w-fit">
                            123-456-7890
                            <button
                              onClick={() => handleCopy("123-456-7890")}
                              className="text-blue-600 hover:text-blue-800"
                              title="Salin Rekening"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </code>
                        </span>
                      ) : step.includes("Contoh:") ? (
                        /* LOGIC COPY PASTE UNTUK CONTOH VA */
                        <span className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span>{step.split("(Contoh:")[0]}</span>
                          <span className="text-xs text-gray-400 italic">
                            (Contoh: 8888xxxxxxxx)
                          </span>
                        </span>
                      ) : (
                        step
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 flex items-start gap-2">
                <div className="font-bold">Note:</div>
                <p>
                  {activeData.id === "transfer"
                    ? "Pembayaran manual wajib melakukan konfirmasi/upload bukti transfer agar pesanan dapat diproses."
                    : "Pembayaran melalui DOKU (VA/QRIS/Retail) diverifikasi otomatis, tidak perlu kirim bukti bayar."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}