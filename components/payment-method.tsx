"use client";

import { CreditCard, ShieldCheck, Upload, Zap } from "lucide-react";
import { PAYMENT_LOGOS } from "@/components/payment-logos";

type PaymentType = "automatic" | "manual";

interface Props {
  paymentType: PaymentType;
  onPaymentTypeChange: (t: PaymentType) => void;
}

export default function PaymentMethodSelector({
  paymentType,
  onPaymentTypeChange,
}: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#6B6B6B]" />
        Metode Pembayaran
      </h3>

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentType === "automatic"
              ? "border-black bg-neutral-50"
              : "border-gray-200 hover:border-gray-400"
          }`}
        >
          <input
            type="radio"
            name="payment-type"
            value="automatic"
            checked={paymentType === "automatic"}
            onChange={() => onPaymentTypeChange("automatic")}
            className="form-radio text-black h-4 w-4 mt-1"
          />
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Pembayaran Online</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Otomatis
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Bayar instan & langsung terverifikasi otomatis. Mendukung QRIS,
              e-wallet, Virtual Account semua bank, hingga kartu kredit/debit.
            </p>

            {/* Strip logo metode pembayaran yang didukung */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {PAYMENT_LOGOS.map(({ key, Logo }) => (
                <span
                  key={key}
                  className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 shadow-sm"
                >
                  <Logo />
                </span>
              ))}
              <span className="flex h-8 items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-2 text-[11px] font-semibold text-gray-500">
                +lainnya
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Transaksi diproses aman oleh payment gateway DOKU.
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentType === "manual"
              ? "border-black bg-neutral-50"
              : "border-gray-200 hover:border-gray-400"
          }`}
        >
          <input
            type="radio"
            name="payment-type"
            value="manual"
            checked={paymentType === "manual"}
            onChange={() => onPaymentTypeChange("manual")}
            className="form-radio text-black h-4 w-4 mt-1"
          />
          <div className="p-2 bg-gray-100 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Transfer Manual</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Transfer bank dan upload bukti pembayaran.
            </p>
          </div>
        </label>

        {paymentType === "manual" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Rekening Tujuan Transfer
                </h4>
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    Naufaludin Akbar
                  </p>
                  <p className="text-sm text-gray-600">Bank BCA</p>
                  <p className="font-mono text-lg font-bold text-gray-900">
                    5465011979
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
