// ── Tipe konten halaman /how-to-order (admin-managed) ───────────────────
//
// Halaman publik mengambil konten dari endpoint:
//   GET /public/how-to-order-content
// Admin mengelola lewat:
//   GET  /web/how-to-order-content
//   PUT  /web/how-to-order-content (multipart/form-data)
//     - field "content" (string): JSON.stringify(HowToOrderContent)
//     - field "media[benefit_<index>]" (file, opsional): icon benefit
//     - field "media[step_<id>]" (file, opsional): gambar step (otomatis
//       di-set ke field steps[i].image_url di response)
//
// Catatan:
// - Untuk gambar/icon, FE bisa kirim URL string (image_url / icon_url) atau
//   upload file via field "media[<key>]". Backend menyimpan & mengganti URL
//   pada field terkait, lalu mengembalikan content lengkap.

export type IconKey =
  | "Shield" | "Truck" | "HeadphonesIcon" | "ShoppingCart"
  | "CreditCard" | "User" | "Package" | "CheckCircle"
  | "Sparkles" | "MessageCircle" | "Mail" | "Star"
  | "Ruler" | "Clock" | "Play";

export interface BgConfig {
  type: "solid" | "gradient" | "image";
  color1: string;
  color2?: string | null;
  image_url?: string | null;
}

export interface Benefit {
  icon: IconKey;
  title: string;
  description: string;
}

export interface HowToOrderStep {
  id: number;            // 1..N
  icon: IconKey;
  title: string;
  description: string;
  image_url: string;     // URL gambar; ganti via media[step_<id>]
  details: string[];
  tips: string[];
}

export interface PaymentMethod {
  emoji: string;         // mis. "🏦"
  title: string;
  description: string;
}

export interface ContactItem {
  icon: IconKey;
  title: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToOrderContent {
  // === Section: Hero ===
  hero_bg: BgConfig;
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;
  benefits: Benefit[];

  // === Section: Steps ===
  steps_bg: BgConfig;
  steps_header_title: string;
  steps_header_subtitle: string;
  steps: HowToOrderStep[];

  // === Section: Payment ===
  payment_bg: BgConfig;
  payment_title: string;
  payment_subtitle: string;
  payment_methods: PaymentMethod[];
  security_title: string;
  security_description: string;

  // === Section: Contact ===
  contact_bg: BgConfig;
  contact_title: string;
  contact_subtitle: string;
  contact_items: ContactItem[];

  // === Section: CTA ===
  cta_bg: BgConfig;
  cta_title: string;
  cta_subtitle: string;
  cta_button_primary_label: string;
  cta_button_primary_url: string;
  cta_button_secondary_label: string;
  cta_button_secondary_url: string;

  // === Section: FAQ ===
  faq_bg: BgConfig;
  faq_title: string;
  faq_subtitle: string;
  faqs: FaqItem[];

  updated_at?: string;
}

export interface HowToOrderContentResponse {
  code: number;
  message: string;
  data: HowToOrderContent;
}

const SOLID_WHITE: BgConfig = { type: "solid", color1: "#ffffff" };

export const DEFAULT_HOW_TO_ORDER_CONTENT: HowToOrderContent = {
  hero_bg: SOLID_WHITE,
  hero_badge: "Ordering Guide",
  hero_title_1: "How To Order From",
  hero_title_2: "BLACKBOX.INC",
  hero_subtitle:
    "Follow our 6 simple steps to successfully purchase your exclusive fashion items. Secure, straightforward, and fast!",

  benefits: [
    { icon: "Shield", title: "Secure Payment", description: "Protected by SSL encryption and Doku." },
    { icon: "Truck",  title: "Fast Shipping",  description: "2-5 working days with real-time tracking." },
    { icon: "HeadphonesIcon", title: "Expert Support", description: "Dedicated team ready to assist 24/7." },
  ],

  steps_bg: SOLID_WHITE,
  steps_header_title: "The 6 Steps Process",
  steps_header_subtitle:
    "A straightforward and secure journey from selection to delivery.",

  steps: [
    {
      id: 1,
      icon: "Ruler",
      title: "Pilih Gaya & Ukuran",
      description:
        "Jelajahi koleksi eksklusif kami dan tentukan item yang sesuai dengan selera dan ukuran Anda.",
      image_url: "/images/new/order-steps/step-1.png",
      details: [
        "Browse kategori (T-Shirt, Denim, Aksesori, dll.)",
        "Gunakan fitur 'Size Guide' untuk memastikan fitting yang sempurna",
        "Lihat detail material dan instruksi perawatan untuk setiap produk",
        "Pilih warna dan varian yang Anda inginkan",
      ],
      tips: [
        "Selalu cek Size Guide untuk menghindari retur",
        "Perhatikan detail cutting (Slim, Oversized, Regular)",
        "Lihat ulasan untuk real-life fitting feedback",
      ],
    },
    {
      id: 2,
      icon: "Package",
      title: "Review Keranjang Belanja",
      description:
        "Verifikasi item dan pastikan semua detail (ukuran, warna, kuantitas) sudah benar sebelum checkout.",
      image_url: "/images/new/order-steps/step-2.png",
      details: [
        "Cek ulang kuantitas dan harga total",
        "Pastikan ukuran dan warna sudah sesuai pilihan",
        "Masukkan kode diskon atau voucher jika ada",
        "Klik 'Proceed to Checkout' untuk lanjut",
      ],
      tips: [
        "Manfaatkan free shipping untuk pembelian di atas Rp 500.000",
        "Periksa kembali detail ukuran sebelum submit",
        "Keranjang akan tersimpan otomatis jika Anda sudah login",
      ],
    },
    {
      id: 3,
      icon: "User",
      title: "Isi Detail Pengiriman",
      description:
        "Lengkapi data Anda, termasuk nama, kontak, dan alamat pengiriman yang akurat.",
      image_url: "/images/new/order-steps/step-3.png",
      details: [
        "Isi nama lengkap dan nomor telepon aktif",
        "Masukkan alamat pengiriman selengkap mungkin (patokan, nomor rumah)",
        "Pilih metode dan estimasi biaya pengiriman",
        "Tambahkan catatan khusus untuk kurir jika diperlukan",
      ],
      tips: [
        "Pastikan nomor telepon aktif untuk konfirmasi kurir",
        "Cek kembali kode pos dan alamat Anda",
        "Alamat yang tidak lengkap bisa menunda pengiriman",
      ],
    },
    {
      id: 4,
      icon: "CreditCard",
      title: "Pilih Metode Pembayaran",
      description:
        "Selesaikan transaksi Anda dengan aman melalui berbagai opsi pembayaran terpercaya (Doku).",
      image_url: "/images/new/order-steps/step-4.png",
      details: [
        "Pilih metode: Transfer Bank, E-Wallet, atau Kartu Kredit/VA",
        "Ikuti instruksi pembayaran yang muncul di layar",
        "Verifikasi pembayaran otomatis dan notifikasi dikirim via email/WhatsApp",
        "Semua transaksi dienkripsi untuk keamanan data Anda",
      ],
      tips: [
        "Gunakan E-Wallet untuk proses tercepat",
        "Simpan kode pembayaran/Virtual Account Anda",
        "Pembayaran harus dilakukan dalam batas waktu yang ditentukan (maks 2 jam)",
      ],
    },
    {
      id: 5,
      icon: "CheckCircle",
      title: "Konfirmasi & Proses Kirim",
      description:
        "Pesanan Anda dikonfirmasi, dan kami segera memulai proses pengepakan dan pengiriman.",
      image_url: "/images/new/order-steps/step-5.png",
      details: [
        "Pesanan diproses dalam 1x24 jam (hari kerja)",
        "Anda akan menerima nomor resi pengiriman setelah produk dikirim",
        "Kami menggunakan packaging premium untuk menjaga kualitas produk",
        "Update status dikirim via email dan notifikasi WhatsApp",
      ],
      tips: [
        "Cek email/WhatsApp secara berkala untuk resi",
        "Pesanan masuk setelah jam 1 siang akan diproses hari kerja berikutnya",
        "Hubungi CS jika resi belum terbit setelah 2 hari kerja",
      ],
    },
    {
      id: 6,
      icon: "Truck",
      title: "Terima & Beri Ulasan",
      description:
        "Paket BLACKBOX.INC tiba! Nikmati produk Anda dan bantu kami dengan memberikan ulasan.",
      image_url: "/images/new/order-steps/step-6.png",
      details: [
        "Periksa kondisi paket saat diterima",
        "Jika ada masalah, hubungi CS segera (sertakan video unboxing)",
        "Login dan berikan review produk untuk mendapatkan loyalty points",
        "Tingkatkan gaya Anda dengan item BLACKBOX.INC yang baru!",
      ],
      tips: [
        "Review yang jujur sangat berharga bagi kami",
        "Simpan nota/invoice untuk klaim garansi retur/tukar ukuran",
        "Abadikan gaya Anda dan tag kami di Instagram!",
      ],
    },
  ],

  payment_bg: SOLID_WHITE,
  payment_title: "Secure Payment Methods",
  payment_subtitle: "Your transaction safety is our priority. Powered by Doku.",
  payment_methods: [
    { emoji: "🏦", title: "Transfer Bank",   description: "BCA, Mandiri, BNI" },
    { emoji: "📱", title: "E-Wallet",        description: "GoPay, OVO, DANA" },
    { emoji: "💳", title: "Credit Card",     description: "Visa, Mastercard" },
    { emoji: "🧾", title: "Virtual Account", description: "All Major Banks" },
  ],
  security_title: "100% Security Guarantee",
  security_description:
    "All transactions are secured with 256-bit SSL encryption and processed via PCI DSS Level 1 certified gateway.",

  contact_bg: SOLID_WHITE,
  contact_title: "Need Assistance?",
  contact_subtitle:
    "Our dedicated support team is available during business hours to assist you with any questions.",
  contact_items: [
    { icon: "MessageCircle",  title: "Live Chat WA",       value: "0895 6227 17884" },
    { icon: "Mail",           title: "Email Support",      value: "blackboxinc14@gmail.com" },
    { icon: "HeadphonesIcon", title: "Operational Hours",  value: "24 HOURS EVERYDAY" },
  ],

  cta_bg: SOLID_WHITE,
  cta_title: "Ready To Define Your Style?",
  cta_subtitle:
    "Explore our exclusive collection and start your journey towards timeless fashion.",
  cta_button_primary_label: "Shop Now",
  cta_button_primary_url: "/product",
  cta_button_secondary_label: "Watch Brand Video",
  cta_button_secondary_url: "#",

  faq_bg: SOLID_WHITE,
  faq_title: "Frequently Asked Questions",
  faq_subtitle:
    "Find quick answers about our shipping, returns, and exchanges.",
  faqs: [
    {
      question: "Berapa lama estimasi pengiriman standar?",
      answer:
        "Estimasi pengiriman standar adalah 2-5 hari kerja untuk wilayah Jabodetabek dan 5-10 hari kerja untuk luar pulau Jawa. Kami akan mengirimkan nomor resi segera setelah pesanan dikirim.",
    },
    {
      question: "Apakah saya bisa menukar ukuran jika tidak pas?",
      answer:
        "Ya, kami menyediakan layanan penukaran ukuran maksimal 2 hari setelah barang diterima pembeli, selama stok yang diinginkan masih tersedia (tidak termasuk barang discount).",
    },
    {
      question: "Apa saja metode pembayaran yang tersedia?",
      answer:
        "Kami bekerja sama dengan Payment Gateway DOKU untuk menyediakan pembayaran yang aman dan lengkap, meliputi: Virtual Account (BCA, Mandiri, BNI, BRI, Permata, CIMB), E-Wallet (QRIS, OVO, ShopeePay, DANA, GoPay), Kartu Kredit/Debit (Visa, Mastercard, JCB), serta pembayaran tunai melalui gerai Alfamart dan Indomaret.",
    },
    {
      question: "Bagaimana jika produk yang diterima cacat?",
      answer:
        "Kami menjamin kualitas produk. Jika produk cacat atau salah kirim, hubungi Customer Service kami dalam 48 jam setelah paket diterima (sertakan video unboxing) untuk proses penggantian tanpa biaya tambahan.",
    },
    {
      question: "Apakah ada biaya untuk penukaran ukuran?",
      answer:
        "Penukaran ukuran tidak dikenakan biaya produk, namun biaya pengiriman kembali ke gudang dan pengiriman ulang kepada Anda ditanggung oleh pembeli, kecuali jika terjadi kesalahan dari pihak kami.",
    },
  ],
};
