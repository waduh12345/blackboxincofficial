"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Home,
  ShoppingBag,
  Loader2,
} from "lucide-react";

import {
  useGetPublicTransactionByIdQuery,
  useGetPublicTransactionByReferenceQuery,
} from "@/services/public-transactions.service";

const LAST_ORDER_KEY = "__last_order__";

type LastOrder = { id: string | null; reference: string | null };

function readLastOrder(): LastOrder {
  if (typeof window === "undefined") return { id: null, reference: null };
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return { id: null, reference: null };
    const p = JSON.parse(raw) as Partial<LastOrder>;
    return { id: p.id ?? null, reference: p.reference ?? null };
  } catch {
    return { id: null, reference: null };
  }
}

function TransactionStatusInner() {
  const searchParams = useSearchParams();

  // Order created at checkout (shared via same-origin localStorage with the
  // DOKU payment tab). Also accept identifiers DOKU may append to the redirect.
  const [last] = useState<LastOrder>(() => readLastOrder());

  const idParam = last.id ?? "";
  const refParam =
    searchParams.get("reference") ||
    searchParams.get("invoice_number") ||
    last.reference ||
    "";

  const hasIdentifier = Boolean(idParam || refParam);

  // Webhook settlement can lag a few seconds behind the redirect → poll briefly.
  const [pollingEnabled, setPollingEnabled] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPollingEnabled(false), 90_000);
    return () => clearTimeout(t);
  }, []);

  const pollingInterval = pollingEnabled ? 4000 : 0;

  const byId = useGetPublicTransactionByIdQuery(idParam, {
    skip: !idParam,
    pollingInterval,
  });
  const byRef = useGetPublicTransactionByReferenceQuery(refParam, {
    skip: Boolean(idParam) || !refParam,
    pollingInterval,
  });

  const tx = byId.data ?? byRef.data;
  const isFetching = byId.isFetching || byRef.isFetching;

  const status = tx?.status;
  const isPaid = status === 1 || status === 2 || Boolean(tx?.paid_at);
  const isFailed = typeof status === "number" && status < 0;

  // Stop polling once we reach a terminal state.
  useEffect(() => {
    if (isPaid || isFailed) setPollingEnabled(false);
  }, [isPaid, isFailed]);

  const reference = tx?.reference || refParam || "";

  const detailHref = useMemo(() => {
    if (tx?.encypted_id) return `/transaction/${tx.encypted_id}`;
    if (idParam) return `/transaction/${idParam}`;
    if (reference) return `/cek-order?ref=${encodeURIComponent(reference)}`;
    return "/me";
  }, [tx?.encypted_id, idParam, reference]);

  // Visual state
  const view: "loading" | "paid" | "pending" | "failed" | "unknown" = !hasIdentifier
    ? "unknown"
    : isPaid
    ? "paid"
    : isFailed
    ? "failed"
    : isFetching && !tx
    ? "loading"
    : "pending";

  const ICON = {
    loading: <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />,
    paid: <CheckCircle2 className="w-10 h-10 text-green-600" />,
    pending: <Clock className="w-10 h-10 text-yellow-600" />,
    failed: <XCircle className="w-10 h-10 text-red-600" />,
    unknown: <Clock className="w-10 h-10 text-gray-900" />,
  }[view];

  const TITLE = {
    loading: "Memeriksa Status Pembayaran…",
    paid: "Pembayaran Berhasil 🎉",
    pending: "Pembayaran Sedang Diproses",
    failed: "Pembayaran Gagal / Dibatalkan",
    unknown: "Terima Kasih",
  }[view];

  const SUBTITLE = {
    loading: "Mohon tunggu sebentar, kami sedang mengonfirmasi pembayaran Anda.",
    paid: "Pesanan Anda telah dibayar dan sedang kami proses. Detail juga kami kirim ke email Anda.",
    pending:
      "Pembayaran Anda sedang dikonfirmasi. Status akan diperbarui otomatis — Anda tidak perlu membayar ulang.",
    failed:
      "Pembayaran tidak berhasil atau dibatalkan. Anda dapat mencoba memesan kembali.",
    unknown:
      "Jika Anda baru saja membayar, status pesanan akan diperbarui otomatis. Cek halaman Pesanan Anda untuk detail.",
  }[view];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {ICON}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {TITLE}
          </h1>
          <p className="text-gray-600 mb-6">{SUBTITLE}</p>

          {reference && (
            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-2">
              <span className="text-sm text-gray-500">Kode Pesanan:</span>
              <span className="text-sm font-mono font-bold text-gray-900">
                {reference}
              </span>
            </div>
          )}

          {typeof tx?.grand_total === "number" && (
            <p className="text-gray-700 mb-6">
              Total:{" "}
              <span className="font-bold text-gray-900">
                Rp {tx.grand_total.toLocaleString("id-ID")}
              </span>
            </p>
          )}

          {view === "pending" && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memperbarui status otomatis…
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={detailHref}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Lihat Detail Pesanan
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
        </div>
      }
    >
      <TransactionStatusInner />
    </Suspense>
  );
}
