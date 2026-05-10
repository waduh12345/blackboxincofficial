// ── Tipe konten halaman /cek-order (admin-managed) ───────────────────────
//
// Halaman publik mengambil konten dari endpoint:
//   GET /public/cek-order-content
// Admin mengelola lewat:
//   GET  /web/cek-order-content
//   PUT  /web/cek-order-content (multipart/form-data, field "content" berisi JSON,
//                                 field "media[<key>]" untuk upload gambar opsional)

export type OrderStatusKey =
  | "PENDING"
  | "PAID"
  | "PROCESSED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export interface CekOrderInfoCard {
  title: string;
  description: string;
}

export interface CekOrderStatusLabel {
  key: OrderStatusKey;
  label: string;       // Label tampilan, mis. "MENUNGGU PEMBAYARAN"
  description: string; // Deskripsi singkat untuk timeline
}

export interface CekOrderTimelineStep {
  key: OrderStatusKey;
  label: string;
}

export interface CekOrderContent {
  // Hero / Header
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string; // bagian yang di-highlight
  hero_subtitle: string;

  // Search bar
  search_placeholder: string;
  search_button_label: string;
  search_button_loading_label: string;

  // Loading state
  loading_text: string;

  // Initial state (sebelum search)
  initial_title: string;
  initial_description: string; // boleh berisi <strong>
  initial_info_cards: CekOrderInfoCard[]; // biasanya 3 kartu

  // Not-found state
  not_found_title: string;
  not_found_description: string; // gunakan {code} sebagai placeholder kode pencarian
  not_found_tips_title: string;
  not_found_tips: string[];

  // Pending payment alert
  pending_alert_title: string;
  pending_alert_description: string;
  pending_alert_button_label: string;
  pending_alert_button_loading_label: string;

  // Result section labels
  reference_label: string;       // "Kode Transaksi"
  date_label: string;            // "Tanggal Pemesanan"
  shipping_section_title: string;
  recipient_label: string;
  courier_label: string;
  resi_label: string;
  items_section_title: string;
  total_label: string;

  // Status labels (warna tetap di FE, tapi label/deskripsi editable)
  status_labels: CekOrderStatusLabel[];

  // Urutan timeline visual (default: PENDING > PAID > PROCESSED > SHIPPED > COMPLETED)
  timeline_steps: CekOrderTimelineStep[];

  // Meta
  updated_at?: string;
}

export interface CekOrderContentResponse {
  code: number;
  message: string;
  data: CekOrderContent;
}

export const DEFAULT_CEK_ORDER_CONTENT: CekOrderContent = {
  hero_badge: "Lacak Kiriman",
  hero_title_1: "Lacak Status",
  hero_title_2: "Pesanan Anda",
  hero_subtitle:
    "Masukkan Kode Transaksi (contoh: TRX-2025...) yang dikirimkan ke email Anda untuk mengetahui posisi paket terkini.",

  search_placeholder: "Masukkan Kode Transaksi...",
  search_button_label: "Lacak",
  search_button_loading_label: "Mencari...",

  loading_text: "Sedang mencari data transaksi...",

  initial_title: "Belum Melacak Pesanan?",
  initial_description:
    'Silakan masukkan <strong>Kode Referensi (TRX-...)</strong> yang Anda dapatkan pada halaman "Terima Kasih" atau yang kami kirimkan melalui Email/WhatsApp.',
  initial_info_cards: [
    { title: "1. Masukkan Kode", description: "Input kode transaksi dengan benar." },
    { title: "2. Cek Status", description: "Lihat posisi terkini paket Anda." },
    { title: "3. Selesai", description: "Paket diterima dengan aman." },
  ],

  not_found_title: "Data Tidak Ditemukan",
  not_found_description:
    "Maaf, kami tidak dapat menemukan data transaksi dengan kode {code}",
  not_found_tips_title: "Tips Pencarian:",
  not_found_tips: [
    "Pastikan kode transaksi sudah benar (Case Sensitive).",
    "Periksa kembali email konfirmasi pesanan Anda.",
    "Hubungi admin jika Anda yakin sudah membayar.",
  ],

  pending_alert_title: "Menunggu Pembayaran",
  pending_alert_description:
    "Pesanan belum dibayar. Silakan upload bukti transfer.",
  pending_alert_button_label: "Bayar Sekarang",
  pending_alert_button_loading_label: "Menyiapkan...",

  reference_label: "Kode Transaksi",
  date_label: "Tanggal Pemesanan",
  shipping_section_title: "Informasi Pengiriman",
  recipient_label: "Penerima",
  courier_label: "Ekspedisi",
  resi_label: "No. Resi",
  items_section_title: "Detail Produk",
  total_label: "Total Belanja",

  status_labels: [
    { key: "PENDING",   label: "PENDING",   description: "Pesanan dibuat, menunggu pembayaran" },
    { key: "PAID",      label: "PAID",      description: "Pembayaran diterima" },
    { key: "PROCESSED", label: "PROCESSED", description: "Pesanan sedang diproses" },
    { key: "SHIPPED",   label: "SHIPPED",   description: "Paket dikirim" },
    { key: "COMPLETED", label: "COMPLETED", description: "Pesanan selesai" },
    { key: "CANCELLED", label: "CANCELLED", description: "Pesanan dibatalkan" },
  ],

  timeline_steps: [
    { key: "PENDING",   label: "Dibuat" },
    { key: "PAID",      label: "Dibayar" },
    { key: "PROCESSED", label: "Diproses" },
    { key: "SHIPPED",   label: "Dikirim" },
    { key: "COMPLETED", label: "Selesai" },
  ],
};
