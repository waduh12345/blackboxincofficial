"use client";

import { Check, Clock, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type PaymentTypeResp = "qris" | "bank_transfer";

export interface PaymentResp {
  id: number;
  driver: string;
  payable_type: string;
  payable_id: number;
  order_id: string;
  transaction_id: string;
  payment_type: PaymentTypeResp;
  account_number: string;
  account_code: string | null;
  channel: string;
  expired_at: string;
  paid_at: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

const bankLabelFrom = (code: string | null, channel: string) =>
  code ? code.replace(/_/g, " ") : channel.toUpperCase();

const qrisImageUrl = (qr: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    qr
  )}&size=480x480`;

const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const useCountdown = (expiredAt: string) => {
  const calc = () =>
    Math.max(
      0,
      Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000)
    );
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiredAt]);
  const mm = Math.floor(left / 60)
    .toString()
    .padStart(2, "0");
  const ss = (left % 60).toString().padStart(2, "0");
  return { left, mm, ss };
};

/** Confetti dekoratif di bagian atas kartu */
const Confetti: React.FC = () => {
  const items = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => {
        const top = Math.random() * 80;
        const left = Math.random() * 100;
        const w = 5 + Math.floor(Math.random() * 6);
        const h = 5 + Math.floor(Math.random() * 8);
        const rotate = Math.floor(Math.random() * 360);
        const colors = ["#f472b6", "#f59e0b", "#60a5fa", "#34d399", "#a78bfa"];
        const bg = colors[i % colors.length];
        return { i, top, left, w, h, rotate, bg };
      }),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[92px]">
      {items.map(({ i, top, left, w, h, rotate, bg }) => (
        <span
          key={i}
          className="absolute rounded-sm opacity-80"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: w,
            height: h,
            transform: `rotate(${rotate}deg)`,
            background: bg,
          }}
        />
      ))}
    </div>
  );
};

/** Kartu kontainer umum */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 sm:p-7 ${className}`}
  >
    {children}
  </div>
);

/** ==== SUCCESS UI — match screenshot ==== */
const SuccessSummary: React.FC<{
  payment: PaymentResp;
  onClose?: () => void;
}> = ({ payment, onClose }) => {
  const price = formatRupiah(payment.amount);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <Confetti />

        {/* Check besar */}
        <div className="flex justify-center">
          <div className="mt-1 h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
        </div>

        {/* Judul & subjudul */}
        <div className="mt-3 text-center">
          <h3 className="text-[22px] font-bold text-neutral-900">
            Payment Successful
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Congratulations! Your payment was received and your account has been
            created successfully
          </p>
        </div>

        {/* Plan-like card ala screenshot */}
        <div className="mt-4 rounded-2xl border p-0 overflow-hidden">
          {/* Header kecil dengan ikon aplikasi */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 shadow-sm" />
            <div className="text-sm font-medium text-neutral-900">
              GPU insights and Analysis
            </div>
          </div>

          {/* Body: PRO plan + price, bullet list */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">PRO plan 🧠</div>
              <div className="text-right">
                <span className="text-lg font-bold">{price}</span>
                <span className="ml-1 text-xs text-neutral-500">/ month</span>
              </div>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-neutral-800">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                360 AI agents
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                Priority access to Grobbot
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                Complete overview
              </li>
            </ul>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600">
              <Clock className="h-3.5 w-3.5" />
              One month subscription
            </div>
          </div>
        </div>

        {/* Hanya tombol OK */}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700"
        >
          OK
        </button>
      </Card>
    </div>
  );
};

/** ==== PANEL UTAMA ==== */
type PanelProps = {
  payment: PaymentResp;
  onClose?: () => void;
  onCopied?: (toast: string) => void;
};

export default function PaymentPanel({
  payment,
  onClose,
  onCopied,
}: PanelProps) {
  // Hooks harus di top-level
  const { mm, ss } = useCountdown(payment.expired_at);

  // Kalkulasi progress (bukan hook)
  const totalSec = Math.max(
    1,
    Math.floor(
      (new Date(payment.expired_at).getTime() -
        new Date(payment.created_at).getTime()) /
        1000
    )
  );
  const leftSec = Math.max(
    0,
    Math.floor((new Date(payment.expired_at).getTime() - Date.now()) / 1000)
  );
  const usedPct = Math.min(
    100,
    Math.max(0, Math.round(((totalSec - leftSec) / totalSec) * 100))
  );

  const copy = async (text: string, toast: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    onCopied?.(toast);
  };

  // ✅ Jika sudah bayar → tampilan sukses seperti screenshot
  if (payment.paid_at) {
    return <SuccessSummary payment={payment} onClose={onClose} />;
  }

  // ======= Menunggu Pembayaran: QRIS (footer hanya OK) =======
  if (payment.payment_type === "qris") {
    return (
      <Card>
        {/* Header */}
        <div className="relative flex flex-col items-center text-center">
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            QRIS
          </span>
          <h3 className="mt-2 text-[clamp(18px,2.6vh,22px)] font-bold text-neutral-900">
            Pembayaran QRIS
          </h3>
          <p className="mt-1 text-[clamp(12px,2vh,14px)] text-neutral-500">
            Scan kode di bawah ini dan bayar sesuai nominal
          </p>
        </div>

        {/* QR */}
        <div className="relative mt-[clamp(12px,2vh,20px)] flex justify-center">
          <img
            src={qrisImageUrl(payment.account_number)}
            alt="QRIS"
            className="rounded-2xl border w-[clamp(180px,30vh,288px)] h-[clamp(180px,30vh,288px)]"
          />
        </div>

        {/* Nominal */}
        <div className="mt-[clamp(12px,2vh,20px)] rounded-2xl border p-[clamp(10px,1.8vh,16px)] text-center">
          <div className="text-neutral-500 text-[clamp(11px,1.8vh,13px)]">
            Nominal
          </div>
          <div className="mt-1 font-extrabold tracking-tight text-[clamp(22px,3.4vh,30px)]">
            {formatRupiah(payment.amount)}
          </div>
        </div>

        {/* Batas bayar + progress */}
        <div className="mt-[clamp(10px,1.8vh,16px)] rounded-2xl border p-[clamp(10px,1.8vh,16px)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <Clock className="w-4 h-4" />
              <span className="text-[clamp(11px,1.8vh,13px)]">Batas bayar</span>
            </div>
            <div className="text-[clamp(11px,1.8vh,13px)] font-semibold">
              {new Date(payment.expired_at).toLocaleString("id-ID")}
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="mt-1 text-[clamp(10px,1.6vh,12px)] text-neutral-500 text-right">
            Sisa waktu:{" "}
            <span className="font-medium">
              {mm}:{ss}
            </span>
          </div>
        </div>

        {/* FOOTER: hanya OK */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          OK
        </button>
      </Card>
    );
  }

  // ======= Menunggu Pembayaran: VA (footer hanya OK) =======
  return (
    <Card className="max-h-[80vh] overflow-auto">
      {/* Header */}
      <div className="relative flex flex-col items-center text-center">
        <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
          Virtual Account
        </span>
        <h3 className="mt-2 text-[clamp(18px,2.6vh,22px)] font-bold text-neutral-900">
          Instruksi Pembayaran
        </h3>
        <p className="mt-1 text-[clamp(12px,2vh,14px)] text-neutral-500">
          Transfer tepat sesuai nominal ke nomor VA berikut
        </p>
      </div>

      {/* Bank */}
      <div className="mt-[clamp(12px,2vh,20px)] rounded-2xl border p-[clamp(10px,1.8vh,16px)] text-center">
        <div className="text-[clamp(11px,1.8vh,13px)] text-neutral-500">
          Bank
        </div>
        <div className="mt-1 text-[clamp(15px,2.2vh,18px)] font-semibold">
          {bankLabelFrom(payment.account_code, payment.channel)}
        </div>
      </div>

      {/* VA number (tombol salin tetap di dalam kartu ini) */}
      <div className="mt-[clamp(10px,1.8vh,16px)] rounded-2xl border p-[clamp(10px,1.8vh,16px)] bg-rose-50/40">
        <div className="text-[clamp(11px,1.8vh,13px)] text-neutral-500">
          Nomor VA
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 font-mono text-[clamp(18px,3vh,24px)] font-bold break-all text-center sm:text-left">
            {payment.account_number}
          </div>
          <button
            onClick={() => copy(payment.account_number, "Nomor VA disalin")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border font-medium hover:bg-rose-50"
          >
            <Copy className="w-4 h-4" />
            Salin
          </button>
        </div>
      </div>

      {/* Amount + expiry */}
      <div className="mt-[clamp(10px,1.8vh,16px)] rounded-2xl border p-[clamp(10px,1.8vh,16px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-3 text-center sm:text-left">
            <div className="text-[clamp(11px,1.8vh,13px)] text-neutral-500">
              Nominal
            </div>
            <div className="mt-1 text-[clamp(20px,3.2vh,28px)] font-extrabold">
              {formatRupiah(payment.amount)}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 text-neutral-600 text-[clamp(11px,1.8vh,13px)]">
              <Clock className="w-4 h-4" /> Batas bayar
            </div>
            <div className="mt-1 font-semibold text-[clamp(11px,1.8vh,13px)]">
              {new Date(payment.expired_at).toLocaleString("id-ID")}
            </div>
            <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-1 text-[clamp(10px,1.6vh,12px)] text-neutral-500 text-right">
              Sisa waktu:{" "}
              <span className="font-medium">
                {mm}:{ss}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: hanya OK */}
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-700"
      >
        OK
      </button>
    </Card>
  );
}