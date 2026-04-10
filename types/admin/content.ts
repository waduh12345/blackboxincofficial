// ── Tipe konten website (CMS) ──────────────────────────────────────────

/** Section konten yang bisa dimuat di halaman home */
export type ContentSection =
  | "hero_slider"      // Slider/banner utama
  | "banner_promo"     // Banner promosi (tengah halaman)
  | "about"            // Tentang toko
  | "testimonial"      // Testimoni pelanggan
  | "footer_info"      // Info footer (alamat, kontak, dll)
  | "popup"            // Popup/modal promo
  | "custom";          // Section custom lainnya

export interface ContentItem {
  id: number;
  section: ContentSection;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;           // URL gambar utama
  image_mobile: string | null;    // URL gambar mobile (opsional)
  link_url: string | null;        // URL tujuan klik
  link_text: string | null;       // Teks tombol/link
  sort_order: number;             // Urutan tampil
  is_active: boolean;
  start_date: string | null;      // Tanggal mulai tampil
  end_date: string | null;        // Tanggal selesai tampil
  metadata: Record<string, unknown> | null;  // Data tambahan (JSON)
  created_at: string;
  updated_at: string;
  media?: Array<{ id: number; original_url: string }>;
}

// ── Request types ──────────────────────────────────────────────────────

export interface ContentListParams {
  page?: number;
  paginate?: number;
  section?: ContentSection;
  is_active?: boolean;
  search?: string;
}

export interface ContentListResponse {
  data: ContentItem[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

export interface ContentDetailResponse {
  code: number;
  message: string;
  data: ContentItem;
}
