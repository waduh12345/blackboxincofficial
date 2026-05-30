"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Calendar,
  FileQuestion,
  SearchX,
  Info,
} from "lucide-react";

import { fredoka, sniglet } from "@/lib/fonts";
import DotdLoader from "@/components/loader/3dot";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { useGetPublicTransactionByReferenceQuery } from "@/services/public-transactions.service";
import { useGetPublicCekOrderContentQuery } from "@/services/public-cek-order-content.service";
import {
  ApiDetail,
  ApiTransaction,
  RawShipmentDetail,
} from "@/types/admin/transaction";
import {
  CekOrderContent,
  DEFAULT_CEK_ORDER_CONTENT,
  OrderStatusKey,
} from "@/types/admin/cek-order-content";

// --- TIPE DATA ---
type OrderStatus = OrderStatusKey;

interface TrackResult {
  id: number;
  reference: string;
  encypted_id: string;
  status: OrderStatus;
  created_at: string;
  grand_total: number;
  resi_number?: string;
  courier: string;
  service: string;
  buyer_name: string;
  buyer_address: string;
  items: {
    id: number;
    name: string;
    image: string;
    qty: number;
    price: number;
  }[];
}

const STATUS_ICON: Record<OrderStatus, React.ElementType> = {
  PENDING: Package,
  PAID: CreditCard,
  PROCESSED: Clock,
  SHIPPED: Truck,
  COMPLETED: CheckCircle,
  CANCELLED: AlertCircle,
};

const STATUS_FALLBACK_ICON = Package;

function TrackOrderContent() {
  const searchParams = useSearchParams();

  // ── Konten dari admin ──────────────────────────────────────
  const { data: contentData } = useGetPublicCekOrderContentQuery();
  const c: CekOrderContent = useMemo(
    () => ({ ...DEFAULT_CEK_ORDER_CONTENT, ...(contentData || {}) }),
    [contentData]
  );
  const statusLabelMap = useMemo(() => {
    const m: Record<string, string> = {};
    c.status_labels.forEach((s) => (m[s.key] = s.label));
    return m;
  }, [c.status_labels]);

  // --- STATE ---
  const [searchCode, setSearchCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const {
    data: transactionData,
    isFetching,
    isError,
  } = useGetPublicTransactionByReferenceQuery(searchCode, {
    skip: !searchCode,
  });

  const toOrderStatus = (statusNum: number): OrderStatus =>
    statusNum === 0 ? "PENDING" : statusNum === 1 ? "PAID" : "SHIPPED";

  const processTransactionData = useCallback((data: ApiTransaction) => {
    const shop = data.shops && data.shops.length > 0 ? data.shops[0] : undefined;

    let shipmentObj: RawShipmentDetail | null = null;
    try {
      if (shop?.shipment_detail) {
        shipmentObj = JSON.parse(shop.shipment_detail);
      }
    } catch {
      shipmentObj = null;
    }

    const items = (shop?.details ?? []).map((detail: ApiDetail) => {
      let productName = "Produk";
      let productImage = "";

      if (detail.product) {
        productName = detail.product.name ?? productName;
        productImage =
          detail.product.image ??
          (detail.product.media && detail.product.media[0]?.original_url) ??
          "";
      } else if (detail.product_detail) {
        try {
          const pd = typeof detail.product_detail === "string" ? JSON.parse(detail.product_detail) : detail.product_detail;
          productName = pd?.name ?? productName;
          productImage = pd?.image ?? productImage;
        } catch {
          // ignore
        }
      }

      return {
        id: detail.id,
        name: productName,
        image: productImage,
        qty: detail.quantity,
        price: detail.price,
        total: detail.total,
      };
    });

    setResult({
      id: data.id,
      reference: data.reference,
      encypted_id: data.encypted_id ?? "",
      status: toOrderStatus(data.status),
      created_at: data.created_at,
      grand_total: data.grand_total,
      resi_number: data.resi_number ?? undefined,
      courier: shipmentObj?.code ?? shop?.courier ?? "",
      service: shipmentObj?.service ?? shop?.shipment_detail ?? "",
      buyer_name: data.guest_name ?? "Guest",
      buyer_address: data.address_line_1 ?? "",
      items,
    });
  }, []);

  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl) {
      setSearchCode(refFromUrl);
      setHasSearched(true);
      setIsLoading(true);
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasSearched || isFetching) return;

    if (transactionData) {
      processTransactionData(transactionData as ApiTransaction);
    } else {
      setResult(null);
    }
    setIsLoading(false);
  }, [
    transactionData,
    isFetching,
    hasSearched,
    isError,
    processTransactionData,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchCode.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Masukkan kode transaksi terlebih dahulu!",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setResult(null);
  };

  // --- HELPER UTILS ---
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "PAID":
        return "bg-gray-200 text-gray-800 border-gray-400";
      case "PROCESSED":
        return "bg-gray-300 text-gray-900 border-gray-500";
      case "SHIPPED":
        return "bg-gray-600 text-white border-gray-700";
      case "COMPLETED":
        return "bg-gray-900 text-white border-black";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStepStatus = (
    step: OrderStatus,
    currentStatus: OrderStatus,
    timeline: OrderStatus[]
  ) => {
    const order = timeline;
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(step);

    if (currentStatus === "CANCELLED") return "inactive";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "inactive";
  };

  const ACCENT_COLOR_TAILWIND = "text-gray-900";
  const ACCENT_BG_TAILWIND = "bg-gray-900";
  const ACCENT_HOVER_TAILWIND = "hover:bg-gray-700";
  const ACCENT_RING_TAILWIND = "focus:ring-gray-900/20";
  const ACCENT_BORDER_TAILWIND = "focus:border-gray-900";

  const timelineKeys = c.timeline_steps.map((s) => s.key) as OrderStatus[];

  // Render description boleh berisi <strong>
  const renderHtml = (html: string) => ({
    __html: html.replace(/\{code\}/g, ""),
  });

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-white to-gray-50 pt-24 pb-12 ${sniglet.className}`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        {/* TITLE SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-4">
            <Truck className={`w-4 h-4 ${ACCENT_COLOR_TAILWIND}`} />
            <span className={`text-sm font-medium ${ACCENT_COLOR_TAILWIND}`}>
              {c.hero_badge}
            </span>
          </div>
          <h1
            className={`text-4xl font-bold text-gray-900 mb-4 ${fredoka.className}`}
          >
            {c.hero_title_1}{" "}
            <span className={ACCENT_COLOR_TAILWIND}>{c.hero_title_2}</span>
          </h1>
          <p className="text-gray-600">{c.hero_subtitle}</p>
        </div>

        {/* SEARCH FORM */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative z-10">
              <Search
                className={`absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:${ACCENT_COLOR_TAILWIND} transition-colors`}
              />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder={c.search_placeholder}
                className={`w-full pl-14 pr-32 py-5 rounded-full border-2 border-gray-200 ${ACCENT_BORDER_TAILWIND} focus:ring-4 ${ACCENT_RING_TAILWIND} shadow-lg text-lg outline-none transition-all`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`absolute right-2 top-2 bottom-2 ${ACCENT_BG_TAILWIND} text-white px-6 rounded-full font-bold ${ACCENT_HOVER_TAILWIND} transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? c.search_button_loading_label : c.search_button_label}
              </button>
            </div>
            <div
              className={`absolute -inset-1 bg-gradient-to-r from-gray-300/50 to-gray-200/50 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500`}
            ></div>
          </form>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="min-h-[400px]">
          {/* 1. LOADING STATE */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <DotdLoader />
              <p className="mt-4 text-gray-500 font-medium">
                {c.loading_text}
              </p>
            </div>
          )}

          {/* 2. INITIAL STATE */}
          {!isLoading && !hasSearched && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileQuestion className={`w-10 h-10 ${ACCENT_COLOR_TAILWIND}`} />
              </div>
              <h3
                className={`text-2xl font-bold text-gray-800 mb-3 ${fredoka.className}`}
              >
                {c.initial_title}
              </h3>
              <p
                className="text-gray-500 mb-8 max-w-md mx-auto"
                dangerouslySetInnerHTML={{ __html: c.initial_description }}
              />

              <div
                className={`grid grid-cols-1 gap-4 text-left ${
                  c.initial_info_cards.length === 3
                    ? "md:grid-cols-3"
                    : c.initial_info_cards.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-3"
                }`}
              >
                {c.initial_info_cards.map((card, idx) => {
                  const Icon =
                    idx === 0 ? Search : idx === 1 ? Truck : CheckCircle;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-100"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-gray-700" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-1">
                        {card.title}
                      </h4>
                      <p className="text-xs text-gray-500">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. NOT FOUND STATE */}
          {!isLoading && hasSearched && !result && (
            <div className="max-w-2xl mx-auto bg-red-50 rounded-3xl p-8 border border-red-100 text-center animate-shake">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-8 h-8 text-red-500" />
              </div>
              <h3
                className={`text-xl font-bold text-gray-900 mb-2 ${fredoka.className}`}
              >
                {c.not_found_title}
              </h3>
              <p className="text-gray-600 mb-6">
                <span dangerouslySetInnerHTML={renderHtml(c.not_found_description)} />
                <br />
                <span className="font-mono font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md mx-1">
                  {searchCode}
                </span>
              </p>
              <div className="bg-white p-4 rounded-xl text-left border border-red-100 inline-block w-full md:w-auto">
                <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />{" "}
                  {c.not_found_tips_title}
                </h4>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  {c.not_found_tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 4. RESULT SECTION */}
          {!isLoading && result && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {c.reference_label}
                    </p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.reference}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {statusLabelMap[result.status] || result.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500 mb-1">{c.date_label}</p>
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Calendar className={`w-4 h-4 ${ACCENT_COLOR_TAILWIND}`} />
                      {format(
                        new Date(result.created_at),
                        "dd MMM yyyy, HH:mm",
                        { locale: idLocale }
                      )}
                    </div>
                  </div>
                </div>

                {/* Pending alert */}
                {result.status === "PENDING" && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-800">
                          {c.pending_alert_title}
                        </p>
                        <p className="text-sm text-yellow-700">
                          {c.pending_alert_description}
                        </p>
                      </div>
                    </div>

                    {result.status === "PENDING" ? (
                      <Link
                        href={`/transaction/${result.encypted_id}`}
                        className="bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors whitespace-nowrap shadow-lg shadow-yellow-500/30"
                      >
                        {c.pending_alert_button_label}
                      </Link>
                    ) : (
                      <div className="h-10 w-32 bg-yellow-200 rounded-xl animate-pulse flex items-center justify-center text-yellow-600 text-xs">
                        {c.pending_alert_button_loading_label}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div className="relative px-4 py-4">
                  <div className="hidden md:flex justify-between items-center relative mb-8">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 -translate-y-1/2 rounded-full" />
                    <div
                      className={`absolute top-1/2 left-0 h-1 ${ACCENT_BG_TAILWIND} -z-0 -translate-y-1/2 rounded-full transition-all duration-1000`}
                      style={{
                        width: (() => {
                          const idx = timelineKeys.indexOf(result.status);
                          if (idx < 0) return "0%";
                          return `${(idx / (timelineKeys.length - 1)) * 100}%`;
                        })(),
                      }}
                    />
                    {c.timeline_steps.map((step, idx) => {
                      const StepIcon =
                        STATUS_ICON[step.key as OrderStatus] ||
                        STATUS_FALLBACK_ICON;
                      const status = getStepStatus(
                        step.key as OrderStatus,
                        result.status,
                        timelineKeys
                      );
                      const isActive =
                        status === "current" || status === "completed";
                      return (
                        <div
                          key={idx}
                          className="relative z-10 flex flex-col items-center bg-white px-2"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 mb-3 transition-all duration-300 ${
                              isActive
                                ? `border-gray-900 bg-gray-900 text-white`
                                : "border-gray-100 bg-gray-50 text-gray-400"
                            }`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              isActive ? ACCENT_COLOR_TAILWIND : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Shipping & Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-lg h-full">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className={`w-5 h-5 ${ACCENT_COLOR_TAILWIND}`} />{" "}
                    {c.shipping_section_title}
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-gray-500 text-xs mb-1">
                        {c.recipient_label}
                      </p>
                      <p className="font-bold text-gray-900">
                        {result.buyer_name}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {result.buyer_address}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                      <div>
                        <p className="text-gray-500 text-xs">
                          {c.courier_label}
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {result.courier.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {result.service}
                        </p>
                      </div>
                      {result.resi_number && (
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">
                            {c.resi_label}
                          </p>
                          <p
                            className={`font-mono font-bold ${ACCENT_COLOR_TAILWIND}`}
                          >
                            {result.resi_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg h-full">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBag className={`w-5 h-5 ${ACCENT_COLOR_TAILWIND}`} />{" "}
                    {c.items_section_title}
                  </h3>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                    {result.items.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 relative flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-xl bg-gray-100"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.qty} x Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className={`font-bold ${ACCENT_COLOR_TAILWIND} text-sm`}>
                          Rp {(item.qty * item.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {c.total_label}
                    </span>
                    <span className={`text-xl font-bold ${ACCENT_COLOR_TAILWIND}`}>
                      Rp{" "}
                      {result.items
                        .reduce((total, item) => total + item.qty * item.price, 0)
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  );
}
