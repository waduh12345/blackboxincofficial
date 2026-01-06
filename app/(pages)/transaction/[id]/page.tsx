"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Copy,
  UploadCloud,
  CreditCard,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Package,
  ArrowLeft,
  Download,
  Layers,
  Maximize2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import Image from "next/image";
import DotdLoader from "@/components/loader/3dot";
import { formatRupiahWithRp } from "@/lib/format-utils";

import {
  useGetPublicTransactionByIdQuery,
  useUpdatePublicTransactionWithFormMutation,
} from "@/services/public-transactions.service";
import type {
  Product,
  ProductMedia,
  ProductVariant,
} from "@/services/public-transactions.service";
import { ProductVariantSize } from "@/services/admin/product-variant-size.service";

// --- GRAYSCALE ACCENT CONSTANTS ---
const ACCENT_TEXT_COLOR = "text-gray-900";
const ACCENT_BG_COLOR = "bg-gray-900";
const ACCENT_HOVER_BG = "hover:bg-gray-700";
const ACCENT_BG_LIGHT = "bg-gray-100";
const ACCENT_SHADOW = "shadow-gray-400/30";
const ACCENT_BORDER = "border-gray-900";

export default function GuestConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: transactionData,
    isLoading,
    isError,
  } = useGetPublicTransactionByIdQuery(transactionId);

  const [uploadPaymentProof] = useUpdatePublicTransactionWithFormMutation();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCopyRekening = (text: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: "success",
      title: "Disalin!",
      text: "Nomor rekening berhasil disalin.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Terlalu Besar",
          text: "Maksimal ukuran file adalah 2MB",
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Pilih File",
        text: "Mohon upload bukti transfer terlebih dahulu.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("transaction_id", transactionId);

      await uploadPaymentProof({ id: transactionId, formData }).unwrap();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Bukti pembayaran berhasil dikirim. Mohon tunggu verifikasi admin.",
        confirmButtonText: "Kembali ke Beranda",
      }).then((result) => {
        if (result.isConfirmed) router.push("/");
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat mengupload bukti pembayaran.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <DotdLoader />
      </div>
    );
  }

  if (isError || !transactionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-500 font-bold text-xl">
          Data Transaksi Tidak Ditemukan
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-gray-700 hover:underline"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const safeParse = <
    T extends Record<string, unknown> = Record<string, unknown>
  >(
    raw?: string | null
  ): T | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const getProductImage = (p?: Product | undefined): string => {
    if (!p) return "";
    if (p.image) return p.image;
    if (p.media && p.media.length > 0) {
      return (p.media[0] as ProductMedia).original_url ?? "";
    }
    return "";
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
      case 2:
        return "Paid";
      case 3:
        return "Proses";
      case 4:
        return "Dikirim";
      case 5:
        return "Completed";
      default:
        return "Unknown";
    }
  };

  // --- LOGIKA TOTAL & BIAYA KIRIM ---
  // Menghitung total shipping cost dari semua shops
  const totalShippingCost = (transactionData.shops ?? []).reduce(
    (acc, s) => acc + (s.shipment_cost ?? 0),
    0
  );

  // Menggunakan grand_total dari API sebagai sumber kebenaran utama
  const grandTotal = transactionData.grand_total;

  // --- LOGIKA PEMBAYARAN ---
  // Cek apakah ada payment link/account number dari gateway
  const paymentUrl = transactionData.payment?.account_number;
  const isPaymentGateway = !!paymentUrl;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-white to-gray-100 pt-24 pb-12`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4`}
          >
            <ArrowLeft className="w-5 h-5" /> Kembali ke Beranda
          </button>

          <div className="text-center">
            <div
              className={`inline-flex items-center gap-2 ${ACCENT_BG_LIGHT} px-4 py-2 rounded-full mb-4`}
            >
              <CreditCard className={`w-4 h-4 ${ACCENT_TEXT_COLOR}`} />
              <span className={`text-sm font-medium ${ACCENT_TEXT_COLOR}`}>
                {getStatusText(transactionData.status)}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Selesaikan <span className={ACCENT_TEXT_COLOR}>Pembayaran</span>
            </h1>
            <p className="text-gray-600">
              Order ID:{" "}
              <span className="font-mono font-bold text-gray-800">
                {transactionData.reference}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: Payment Method Display */}
          <div className="lg:col-span-2 space-y-6">
            {isPaymentGateway ? (
              /* --- TAMPILAN PAYMENT GATEWAY (DOKU/DSB) --- */
              <div
                className={`bg-white rounded-3xl p-8 shadow-lg border-l-4 ${ACCENT_BORDER}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-2">
                    Pembayaran Otomatis
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Silakan selesaikan pembayaran Anda melalui Payment Gateway
                    kami. Verifikasi akan dilakukan secara otomatis setelah
                    pembayaran berhasil.
                  </p>

                  <div className="w-full max-w-sm bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Total Tagihan</p>
                    <p className={`text-3xl font-bold ${ACCENT_TEXT_COLOR}`}>
                      {formatRupiahWithRp(grandTotal)}
                    </p>
                  </div>

                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 w-full max-w-sm ${ACCENT_BG_COLOR} text-white py-4 rounded-2xl font-bold text-lg ${ACCENT_HOVER_BG} transition-all shadow-lg hover:shadow-xl`}
                  >
                    Bayar Sekarang <ExternalLink className="w-5 h-5" />
                  </a>

                  <p className="text-xs text-gray-400 mt-4">
                    Link pembayaran akan terbuka di tab baru.
                  </p>
                </div>
              </div>
            ) : (
              /* --- TAMPILAN MANUAL TRANSFER --- */
              <>
                <div
                  className={`bg-white rounded-3xl p-6 shadow-lg border-l-4 ${ACCENT_BORDER}`}
                >
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className={`w-6 h-6 ${ACCENT_TEXT_COLOR}`} />
                    Transfer Pembayaran
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-10 bg-gray-800 rounded flex items-center justify-center text-white font-bold italic">
                          BCA
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Bank Central Asia
                          </p>
                          <p className="font-bold text-gray-900">
                            PT. KREASI ANAK BANGSA
                          </p>
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm text-gray-500 mb-1">
                          Nomor Rekening
                        </p>
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                          <span className="text-xl font-mono font-bold text-gray-800 tracking-wider">
                            8735089123
                          </span>
                          <button
                            onClick={() => handleCopyRekening("8735089123")}
                            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${ACCENT_TEXT_COLOR}`}
                            title="Salin"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <p className="text-gray-600 mb-2">
                        Total yang harus dibayar:
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`text-3xl lg:text-4xl font-bold ${ACCENT_TEXT_COLOR}`}
                        >
                          {formatRupiahWithRp(grandTotal)}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyRekening(grandTotal.toString())
                          }
                          className={`text-gray-400 hover:text-gray-700`}
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>
                          Mohon transfer tepat hingga 3 digit terakhir untuk
                          mempercepat verifikasi otomatis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Upload hanya muncul jika Manual Transfer */}
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                    <UploadCloud className={`w-6 h-6 ${ACCENT_TEXT_COLOR}`} />
                    Konfirmasi Pembayaran
                  </h3>

                  <p className="text-gray-600 mb-6">
                    Sudah melakukan transfer? Silakan upload bukti struk atau
                    screenshot transfer di bawah ini.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />

                    {previewUrl ? (
                      <div className="relative w-full h-64 max-w-md mx-auto">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain rounded-xl"
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow">
                          Ganti File
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div
                          className={`w-16 h-16 ${ACCENT_BG_LIGHT} rounded-full flex items-center justify-center mb-4 ${ACCENT_TEXT_COLOR}`}
                        >
                          <Download className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-1">
                          Klik atau Tarik File ke Sini
                        </p>
                        <p className="text-sm text-gray-500">
                          Format: JPG, PNG (Max 2MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className={`w-full mt-6 ${ACCENT_BG_COLOR} text-white py-4 rounded-2xl font-bold text-lg ${ACCENT_HOVER_BG} transition-all shadow-lg ${ACCENT_SHADOW} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Kirim Bukti Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Transaction Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <span className="text-gray-500">Tanggal Transaksi</span>
                <span className="font-bold text-gray-900">
                  {format(new Date(transactionData.created_at), "dd MMM yyyy", {
                    locale: idLocale,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className="px-3 py-1 {ACCENT_BG_LIGHT} text-gray-700 rounded-full text-sm font-bold capitalize">
                  {getStatusText(transactionData.status)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className={`w-5 h-5 ${ACCENT_TEXT_COLOR}`} /> Info Pembeli
              </h3>
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div>
                  <p className="text-xs text-gray-400">Nama</p>
                  <p className="font-bold text-gray-800">
                    {transactionData.guest_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Kontak</p>
                  <p className="font-medium">{transactionData.guest_email}</p>
                  <p className="font-medium">{transactionData.guest_phone}</p>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                <MapPin className={`w-5 h-5 ${ACCENT_TEXT_COLOR}`} /> Alamat
                Pengiriman
              </h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                <p className="font-medium text-gray-900 mb-1">
                  {transactionData.address_line_1}
                </p>
                {transactionData.address_line_2 && (
                  <p className="mb-1">{transactionData.address_line_2}</p>
                )}
                <p>
                  {transactionData.district_name}, {transactionData.city_name}
                </p>
                <p>
                  {transactionData.province_name} {transactionData.postal_code}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <div
                  className={`${ACCENT_BG_LIGHT} text-gray-800 px-3 py-1 rounded-lg font-bold uppercase`}
                >
                  {transactionData.courier ??
                    transactionData.shops?.[0]?.courier ??
                    ""}
                </div>
                <span className="text-gray-500">
                  {(transactionData.service as string | undefined) ??
                    safeParse<{ service?: string }>(
                      transactionData.shops?.[0]?.shipment_detail ?? null
                    )?.service ??
                    ""}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className={`w-5 h-5 ${ACCENT_TEXT_COLOR}`} /> Detail
                Produk
              </h3>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {/* Flatten shops -> details untuk menampilkan list produk */}
                {transactionData.shops
                  ?.flatMap((shop) =>
                    shop.details.map((d) => ({ shop, detail: d }))
                  )
                  .map(({ shop, detail }) => {
                    const product = detail.product;
                    const img = getProductImage(product);

                    // --- LOGIKA VARIAN & SIZE ---
                    const variantName = detail.product_variant?.name;
                    // Cari nama size dari product_variant_sizes berdasarkan ID yang tersimpan di detail
                    const sizeName =
                      detail.product_variant?.product_variant_sizes?.find(
                        (s) => s.id === detail.product_variant_size_id
                      )?.name;

                    return (
                      <div key={detail.id} className="flex gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {img ? (
                            <Image
                              src={img}
                              alt={product?.name ?? "produk"}
                              fill
                              className="object-cover rounded-lg bg-gray-100"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-lg" />
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 line-clamp-2">
                            {product?.name ?? "Produk"}
                          </p>

                          {/* BADGE VARIANT & SIZE */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {variantName && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600 border border-gray-200">
                                <Layers className="w-2.5 h-2.5" /> {variantName}
                              </span>
                            )}
                            {sizeName && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600 border border-gray-200">
                                <Maximize2 className="w-2.5 h-2.5" /> {sizeName}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-gray-500">
                              {detail.quantity} x Rp{" "}
                              {formatRupiahWithRp(detail.price)}
                            </span>
                            <span className="font-bold text-gray-800">
                              {formatRupiahWithRp(
                                detail.quantity * detail.price
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Ongkos Kirim</span>
                  <span>{formatRupiahWithRp(totalShippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2">
                  <span>Total</span>
                  <span className={ACCENT_TEXT_COLOR}>
                    {formatRupiahWithRp(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}