"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  HelpCircle,
  FileQuestion,
  SearchX,
  Info,
} from "lucide-react";

import { fredoka, sniglet } from "@/lib/fonts";
import DotdLoader from "@/components/loader/3dot";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getEncryptedTransactionId } from "@/app/actions/security";

// Importing the service hook to fetch data from the API
import { useGetPublicTransactionByReferenceQuery } from "@/services/public-transactions.service";
import { ApiDetail, ApiTransaction, RawShipmentDetail } from "@/types/admin/transaction";

// --- TIPE DATA ---
type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

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
  history: {
    status: OrderStatus;
    description: string;
    date: string;
  }[];
}

interface Product {
  id: number;
  name: string;
  image: string;
}

interface TransactionDetail {
  id: number;
  product: Product;
  quantity: number;
  price: number;
}

export default function TrackOrderPage() {
  const router = useRouter();

  // --- STATE ---
  const [searchCode, setSearchCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // New state untuk mendeteksi apakah sudah pernah mencari
  const [result, setResult] = useState<TrackResult | null>(null);
  const [encryptedPaymentId, setEncryptedPaymentId] = useState<string | null>(
    null
  );

  // Service hook
  const {
    data: transactionData,
    isLoading: isFetching,
    isError,
  } = useGetPublicTransactionByReferenceQuery(searchCode, {
    skip: !searchCode,
  });

  // Efek samping untuk generate encrypted ID setiap kali result berubah
  useEffect(() => {
    const generateEncryptedId = async () => {
      if (result && result.id) {
        const res = await getEncryptedTransactionId(result.id);
        if (res.success && res.data) {
          setEncryptedPaymentId(res.data);
        }
      }
    };

    generateEncryptedId();
  }, [result]);

  const toOrderStatus = (statusNum: number) =>
    statusNum === 0 ? "PENDING" : statusNum === 1 ? "PAID" : "SHIPPED";

  const handleSearch = async (e: React.FormEvent) => {
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
    setHasSearched(true); // Tandai bahwa user sudah menekan tombol cari
    setResult(null);

    // Simulasi delay sedikit agar UX loading terasa (opsional)
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (transactionData) {
      const apiTx = transactionData as ApiTransaction;

      // Ambil shop pertama (sesuaikan bila multi-shop)
      const shop =
        apiTx.shops && apiTx.shops.length > 0 ? apiTx.shops[0] : undefined;

      // Parse shipment detail (string JSON) jika ada
      let shipmentObj: RawShipmentDetail | null = null;
      try {
        if (shop?.shipment_detail) {
          shipmentObj = JSON.parse(shop.shipment_detail);
        }
      } catch (e) {
        shipmentObj = null;
        console.warn("Failed to parse shipment_detail", e);
      }

      const items = (shop?.details ?? []).map((detail: ApiDetail) => {
        // prefer API embedded product object; fallback ke parsing product_detail
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
            const pd = JSON.parse(detail.product_detail);
            productName = pd.name ?? productName;
            productImage = pd.image ?? productImage;
          } catch (e) {
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

      const mockData: TrackResult = {
        id: apiTx.id,
        reference: apiTx.reference,
        encypted_id: apiTx.encypted_id ?? "",
        status: toOrderStatus(apiTx.status),
        created_at: apiTx.created_at,
        grand_total: apiTx.grand_total,
        resi_number: apiTx.resi_number ?? undefined,
        courier: shipmentObj?.code ?? shop?.courier ?? "",
        service: shipmentObj?.service ?? shop?.shipment_detail ?? "",
        buyer_name: apiTx.guest_name ?? "Guest",
        buyer_address: apiTx.address_line_1 ?? "",
        items,
        history: [
          {
            status: "PENDING",
            description: "Pesanan dibuat, menunggu pembayaran",
            date: apiTx.created_at,
          },
          // ... kamu bisa inject history nyata kalau API sediakan
        ],
      };

      setResult(mockData);
    } else {
      // Jika data tidak ditemukan di API (atau API error)
      // Tidak perlu Swal, cukup biarkan UI 'Not Found' di bawah yang muncul
    }

    setIsLoading(false);
  };

  // --- HELPER UTILS ---
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        // Kuning/Pending -> Abu-abu terang/Teks abu-abu
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "PAID":
        // Biru/Paid -> Abu-abu sedang/Teks abu-abu gelap
        return "bg-gray-200 text-gray-800 border-gray-400";
      case "PROCESSED":
        // Indigo/Processed -> Abu-abu sedang/Teks hitam
        return "bg-gray-300 text-gray-900 border-gray-500";
      case "SHIPPED":
        // Ungu/Shipped -> Abu-abu gelap/Teks putih
        return "bg-gray-600 text-white border-gray-700";
      case "COMPLETED":
        // Hijau/Completed -> Hitam/Teks putih
        return "bg-gray-900 text-white border-black";
      case "CANCELLED":
        // Merah/Cancelled -> Merah terang (Untuk menonjolkan Batal)
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStepStatus = (step: string, currentStatus: OrderStatus) => {
    const order = ["PENDING", "PAID", "PROCESSED", "SHIPPED", "COMPLETED"];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(step);

    if (currentStatus === "CANCELLED") return "inactive";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "inactive";
  };

  // Ganti warna aksen utama: #[A3B18A] -> #333 (Hitam/Abu-abu gelap)
  const ACCENT_COLOR_HEX = "#333333";
  const ACCENT_COLOR_TAILWIND = "text-gray-900";
  const ACCENT_BG_TAILWIND = "bg-gray-900";
  const ACCENT_HOVER_TAILWIND = "hover:bg-gray-700";
  const ACCENT_RING_TAILWIND = "focus:ring-gray-900/20";
  const ACCENT_BORDER_TAILWIND = "focus:border-gray-900";

  return (
    <div
      // Ganti gradient dari putih/hijau ke putih/abu-abu
      className={`min-h-screen bg-gradient-to-br from-white to-gray-50 pt-24 pb-12 ${sniglet.className}`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        {/* TITLE SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-4">
            <Truck className={`w-4 h-4 ${ACCENT_COLOR_TAILWIND}`} />
            <span className={`text-sm font-medium ${ACCENT_COLOR_TAILWIND}`}>
              Lacak Kiriman
            </span>
          </div>
          <h1
            className={`text-4xl font-bold text-gray-900 mb-4 ${fredoka.className}`}
          >
            Lacak Status{" "}
            <span className={ACCENT_COLOR_TAILWIND}>Pesanan Anda</span>
          </h1>
          <p className="text-gray-600">
            Masukkan Kode Transaksi (contoh: TRX-2025...) yang dikirimkan ke
            email Anda untuk mengetahui posisi paket terkini.
          </p>
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
                placeholder="Masukkan Kode Transaksi..."
                // Ganti fokus warna
                className={`w-full pl-14 pr-32 py-5 rounded-full border-2 border-gray-200 ${ACCENT_BORDER_TAILWIND} focus:ring-4 ${ACCENT_RING_TAILWIND} shadow-lg text-lg outline-none transition-all`}
              />
              <button
                type="submit"
                disabled={isLoading}
                // Ganti warna tombol
                className={`absolute right-2 top-2 bottom-2 ${ACCENT_BG_TAILWIND} text-white px-6 rounded-full font-bold ${ACCENT_HOVER_TAILWIND} transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Mencari..." : "Lacak"}
              </button>
            </div>
            {/* Decorative shadow - ganti gradient */}
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
                Sedang mencari data transaksi...
              </p>
            </div>
          )}

          {/* 2. INITIAL STATE (Belum mencari) */}
          {!isLoading && !hasSearched && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm text-center animate-fade-in-up">
              {/* Ganti warna ikon dan background */}
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileQuestion
                  className={`w-10 h-10 ${ACCENT_COLOR_TAILWIND}`}
                />
              </div>
              <h3
                className={`text-2xl font-bold text-gray-800 mb-3 ${fredoka.className}`}
              >
                Belum Melacak Pesanan?
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Silakan masukkan <strong>Kode Referensi (TRX-...)</strong>{" "}
                {`yang Anda dapatkan pada halaman "Terima Kasih" atau yang kami kirimkan melalui Email/WhatsApp.`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Info Card 1 - Ganti warna biru */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <Search className="w-4 h-4 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    1. Masukkan Kode
                  </h4>
                  <p className="text-xs text-gray-500">
                    Input kode transaksi dengan benar.
                  </p>
                </div>
                {/* Info Card 2 - Ganti warna ungu */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <Truck className="w-4 h-4 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    2. Cek Status
                  </h4>
                  <p className="text-xs text-gray-500">
                    Lihat posisi terkini paket Anda.
                  </p>
                </div>
                {/* Info Card 3 - Ganti warna hijau */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-4 h-4 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">
                    3. Selesai
                  </h4>
                  <p className="text-xs text-gray-500">
                    Paket diterima dengan aman.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. NOT FOUND STATE (Sudah mencari tapi hasil kosong) */}
          {!isLoading && hasSearched && !result && (
            <div className="max-w-2xl mx-auto bg-red-50 rounded-3xl p-8 border border-red-100 text-center animate-shake">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-8 h-8 text-red-500" />
              </div>
              <h3
                className={`text-xl font-bold text-gray-900 mb-2 ${fredoka.className}`}
              >
                Data Tidak Ditemukan
              </h3>
              <p className="text-gray-600 mb-6">
                Maaf, kami tidak dapat menemukan data transaksi dengan kode{" "}
                <br />
                <span className="font-mono font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md mx-1">
                  {searchCode}
                </span>
              </p>
              <div className="bg-white p-4 rounded-xl text-left border border-red-100 inline-block w-full md:w-auto">
                <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" /> Tips Pencarian:
                </h4>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Pastikan kode transaksi sudah benar (Case Sensitive).</li>
                  <li>Periksa kembali email konfirmasi pesanan Anda.</li>
                  <li>Hubungi admin jika Anda yakin sudah membayar.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 4. RESULT SECTION (Data Ditemukan) */}
          {!isLoading && result && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 mb-6">
                {/* ... (Kode Card Header) ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Kode Transaksi</p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.reference}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {result.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500 mb-1">
                      Tanggal Pemesanan
                    </p>
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      {/* Ganti warna ikon */}
                      <Calendar
                        className={`w-4 h-4 ${ACCENT_COLOR_TAILWIND}`}
                      />
                      {format(
                        new Date(result.created_at),
                        "dd MMM yyyy, HH:mm",
                        {
                          locale: idLocale,
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Alert if Pending - Pertahankan warna kuning karena status PENDING butuh perhatian */}
                {result.status === "PENDING" && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-800">
                          Menunggu Pembayaran
                        </p>
                        <p className="text-sm text-yellow-700">
                          Pesanan belum dibayar. Silakan upload bukti transfer.
                        </p>
                      </div>
                    </div>

                    {/* Logic Tombol Bayar dengan Encrypted ID - Pertahankan warna kuning untuk Call to Action penting */}
                    {result.status === "PENDING" ? (
                      <Link
                        // Menggunakan encodeURIComponent agar karakter spesial (:, +) di string enkripsi aman di URL
                        href={`/transaction/${result.encypted_id}`}
                        className="bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors whitespace-nowrap shadow-lg shadow-yellow-500/30"
                      >
                        Bayar Sekarang
                      </Link>
                    ) : (
                      // Tampilkan loading state pada tombol saat proses enkripsi berjalan
                      <div className="h-10 w-32 bg-yellow-200 rounded-xl animate-pulse flex items-center justify-center text-yellow-600 text-xs">
                        Menyiapkan...
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Visual */}
                <div className="relative px-4 py-4">
                  {/* Desktop Timeline Visualization (Simplified for brevity) */}
                  <div className="hidden md:flex justify-between items-center relative mb-8">
                    {/* Line Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 -translate-y-1/2 rounded-full" />
                    <div
                      // Ganti warna line progress
                      className={`absolute top-1/2 left-0 h-1 ${ACCENT_BG_TAILWIND} -z-0 -translate-y-1/2 rounded-full transition-all duration-1000`}
                      style={{
                        width:
                          result.status === "COMPLETED"
                            ? "100%"
                            : result.status === "SHIPPED"
                            ? "75%"
                            : result.status === "PROCESSED"
                            ? "50%"
                            : result.status === "PAID"
                            ? "25%"
                            : "0%",
                      }}
                    />
                    {[
                      { key: "PENDING", label: "Dibuat", icon: Package },
                      { key: "PAID", label: "Dibayar", icon: CreditCard },
                      { key: "PROCESSED", label: "Diproses", icon: Clock },
                      { key: "SHIPPED", label: "Dikirim", icon: Truck },
                      { key: "COMPLETED", label: "Selesai", icon: CheckCircle },
                    ].map((step, idx) => {
                      const status = getStepStatus(step.key, result.status);
                      const isActive =
                        status === "current" || status === "completed";
                      return (
                        <div
                          key={idx}
                          className="relative z-10 flex flex-col items-center bg-white px-2"
                        >
                          <div
                            // Ganti warna dot/icon progress
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 mb-3 transition-all duration-300 ${
                              isActive
                                ? `border-gray-900 bg-gray-900 text-white`
                                : "border-gray-100 bg-gray-50 text-gray-400"
                            }`}
                          >
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span
                            // Ganti warna teks progress
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

              {/* 2 Columns: Shipping & Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Info */}
                <div className="bg-white rounded-3xl p-6 shadow-lg h-full">
                  <h3
                    className={`font-bold text-gray-900 mb-4 flex items-center gap-2`}
                  >
                    {/* Ganti warna ikon */}
                    <MapPin
                      className={`w-5 h-5 ${ACCENT_COLOR_TAILWIND}`}
                    />{" "}
                    Informasi Pengiriman
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-gray-500 text-xs mb-1">Penerima</p>
                      <p className="font-bold text-gray-900">
                        {result.buyer_name}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {result.buyer_address}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                      <div>
                        <p className="text-gray-500 text-xs">Ekspedisi</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {result.courier.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {result.service}
                        </p>
                      </div>
                      {result.resi_number && (
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">No. Resi</p>
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

                {/* Items Info */}
                <div className="bg-white rounded-3xl p-6 shadow-lg h-full">
                  <h3
                    className={`font-bold text-gray-900 mb-4 flex items-center gap-2`}
                  >
                    {/* Ganti warna ikon */}
                    <ShoppingBag
                      className={`w-5 h-5 ${ACCENT_COLOR_TAILWIND}`}
                    />{" "}
                    Detail Produk
                  </h3>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                    {result.items.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 relative flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            // Image sudah netral (hitam putih hanya memengaruhi style/color tailwind)
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
                        {/* Ganti warna harga total */}
                        <p
                          className={`font-bold ${ACCENT_COLOR_TAILWIND} text-sm`}
                        >
                          Rp {(item.qty * item.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      Total Belanja
                    </span>
                    {/* Ganti warna total belanja */}
                    <span
                      className={`text-xl font-bold ${ACCENT_COLOR_TAILWIND}`}
                    >
                      Rp{" "}
                      {result.items
                        .reduce(
                          (total, item) => total + item.qty * item.price,
                          0
                        )
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