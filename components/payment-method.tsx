"use client";

import { CreditCard, Building2, QrCode, Smartphone } from "lucide-react";
import type { PaymentMethod, PaymentChannel } from "@/types/admin/transaction";

type PaymentType = "automatic" | "manual";

interface Props {
  paymentType: PaymentType;
  onPaymentTypeChange: (t: PaymentType) => void;
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  paymentChannel?: PaymentChannel;
  onPaymentChannelChange: (c: PaymentChannel) => void;
}

const VA_CHANNELS: { value: PaymentChannel; label: string }[] = [
  { value: "bca", label: "BCA" },
  { value: "bni", label: "BNI" },
  { value: "bri", label: "BRI" },
  { value: "mandiri", label: "Mandiri" },
  { value: "cimb", label: "CIMB Niaga" },
  { value: "permata", label: "Permata" },
  { value: "bsi", label: "BSI" },
];

const EWALLET_CHANNELS: { value: PaymentChannel; label: string }[] = [
  { value: "gopay", label: "GoPay" },
  { value: "ovo", label: "OVO" },
  { value: "dana", label: "DANA" },
  { value: "shopeepay", label: "ShopeePay" },
  { value: "linkaja", label: "LinkAja" },
];

const PAYMENT_OPTIONS: {
  method: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    method: "bank_transfer",
    label: "Virtual Account",
    desc: "BCA, BNI, BRI, Mandiri, CIMB, dll.",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    method: "qris",
    label: "QRIS",
    desc: "Scan QR — semua aplikasi e-wallet & m-banking",
    icon: <QrCode className="w-5 h-5" />,
  },
  {
    method: "emoney",
    label: "E-Wallet",
    desc: "GoPay, OVO, DANA, ShopeePay, LinkAja",
    icon: <Smartphone className="w-5 h-5" />,
  },
];

export default function PaymentMethodSelector({
  paymentType,
  onPaymentTypeChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentChannel,
  onPaymentChannelChange,
}: Props) {
  const handleMethodSelect = (m: PaymentMethod) => {
    onPaymentMethodChange(m);
    // Auto-set channel for QRIS (only one channel)
    if (m === "qris") {
      onPaymentChannelChange("qris");
      onPaymentTypeChange("automatic");
    } else {
      onPaymentTypeChange("automatic");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#6B6B6B]" />
        Metode Pembayaran
      </h3>

      <div className="space-y-4">
        {/* === TIPE: Otomatis vs Manual === */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipe Pembayaran
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
              <input
                type="radio"
                name="payment-type"
                value="automatic"
                checked={paymentType === "automatic"}
                onChange={() => onPaymentTypeChange("automatic")}
                className="form-radio text-[#6B6B6B] h-4 w-4"
              />
              <div>
                <p className="font-medium">Otomatis (DOKU)</p>
                <p className="text-sm text-gray-500">
                  Virtual Account, QRIS, atau E-Wallet — verifikasi otomatis
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
              <input
                type="radio"
                name="payment-type"
                value="manual"
                checked={paymentType === "manual"}
                onChange={() => onPaymentTypeChange("manual")}
                className="form-radio text-[#6B6B6B] h-4 w-4"
              />
              <div>
                <p className="font-medium">Manual</p>
                <p className="text-sm text-gray-500">Transfer bank manual</p>
              </div>
            </label>
          </div>
        </div>

        {/* === PILIHAN METODE (hanya jika Otomatis) === */}
        {paymentType === "automatic" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Metode
            </label>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.method}
                  className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === opt.method
                      ? "border-black bg-neutral-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={opt.method}
                    checked={paymentMethod === opt.method}
                    onChange={() => handleMethodSelect(opt.method)}
                    className="form-radio text-black h-4 w-4"
                  />
                  <div className="p-2 bg-gray-100 rounded-lg">{opt.icon}</div>
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* === SUB-CHANNEL: Virtual Account === */}
        {paymentType === "automatic" && paymentMethod === "bank_transfer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Bank
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VA_CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => onPaymentChannelChange(ch.value)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    paymentChannel === ch.value
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === SUB-CHANNEL: E-Wallet === */}
        {paymentType === "automatic" && paymentMethod === "emoney" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih E-Wallet
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EWALLET_CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => onPaymentChannelChange(ch.value)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    paymentChannel === ch.value
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === INFO MANUAL === */}
        {paymentType === "manual" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Rekening Tujuan Transfer
                </h4>
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    Warna Kreasi Alam PT
                  </p>
                  <p className="text-sm text-gray-600">Bank BCA</p>
                  <p className="font-mono text-lg font-bold text-gray-900">
                    7311087405
                  </p>
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  Setelah transfer, Anda dapat mengupload bukti pembayaran
                  melalui halaman profil pesanan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
