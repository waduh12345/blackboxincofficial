"use client";

import { CreditCard } from "lucide-react";

type PaymentType = "automatic" | "manual" | "cod";

export default function PaymentType({
  value,
  onChange,
}: {
  value: PaymentType;
  onChange: (next: PaymentType) => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#6B6B6B]" />
        Metode Pembayaran
      </h3>

      <div className="space-y-4">
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
                checked={value === "automatic"}
                onChange={() => onChange("automatic")}
                className="form-radio text-[#6B6B6B] h-4 w-4"
              />
              <div>
                <p className="font-medium">Otomatis</p>
                <p className="text-sm text-gray-500">
                  Pembayaran online (Gateway)
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
              <input
                type="radio"
                name="payment-type"
                value="manual"
                checked={value === "manual"}
                onChange={() => onChange("manual")}
                className="form-radio text-[#6B6B6B] h-4 w-4"
              />
              <div>
                <p className="font-medium">Manual</p>
                <p className="text-sm text-gray-500">Transfer bank manual</p>
              </div>
            </label>
          </div>
        </div>

        {value === "manual" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Rekening Tujuan Transfer
                  </h4>

                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-gray-900">
                      Warna Kreasi Alam PT
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
          </div>
        )}
      </div>
    </div>
  );
}