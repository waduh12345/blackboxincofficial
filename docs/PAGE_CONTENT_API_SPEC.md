# Page Content API Specification

API spec untuk konten dua halaman publik yang dikelola dari admin:

- `/cek-order` — Halaman pelacakan order (konten statis editable, logic tetap)
- `/how-to-order` — Panduan pemesanan (full editable)

> **Cara pakai dokumen ini**
>
> Dokumen ini siap langsung di-paste ke prompt untuk backend (Laravel) atau AI
> code-gen. Frontend (Next.js + RTK Query) sudah di-implement dan mengonsumsi
> endpoint di bawah, sehingga begitu backend selesai, halaman publik &
> dashboard admin akan langsung berjalan.
>
> Base URL FE: `process.env.NEXT_PUBLIC_API_BASE_URL` =
> `https://api.blackboxincofficial.com/api/v1`
>
> Auth admin: header `Authorization: Bearer <token>` (NextAuth session token).

---

## 1. Halaman `/cek-order`

### 1.1 Endpoint

| Method | URL                              | Auth   | Deskripsi                                |
| ------ | -------------------------------- | ------ | ---------------------------------------- |
| GET    | `/api/v1/public/cek-order-content` | Public | Mengambil konten halaman publik          |
| GET    | `/api/v1/web/cek-order-content`    | Admin  | Mengambil konten untuk editor admin      |
| PUT    | `/api/v1/web/cek-order-content`    | Admin  | Memperbarui konten (singleton, no `id`)  |

> Backend boleh menerima `POST` dengan `_method=PUT` (Laravel form-method spoofing) — FE sudah memakai pola ini.

### 1.2 Catatan model data

Singleton record. Tidak ada koleksi/banyak baris. Cukup 1 baris di tabel
`cek_order_contents` (atau simpan sebagai 1 dokumen JSON di tabel `settings`
dengan `key="cek_order_content"`).

### 1.3 Schema (TypeScript reference)

```ts
type OrderStatusKey =
  | "PENDING" | "PAID" | "PROCESSED" | "SHIPPED" | "COMPLETED" | "CANCELLED";

interface CekOrderInfoCard { title: string; description: string; }
interface CekOrderStatusLabel { key: OrderStatusKey; label: string; description: string; }
interface CekOrderTimelineStep { key: OrderStatusKey; label: string; }

interface CekOrderContent {
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;

  search_placeholder: string;
  search_button_label: string;
  search_button_loading_label: string;

  loading_text: string;

  initial_title: string;
  initial_description: string;          // boleh berisi <strong>
  initial_info_cards: CekOrderInfoCard[];

  not_found_title: string;
  not_found_description: string;        // gunakan {code} sebagai placeholder
  not_found_tips_title: string;
  not_found_tips: string[];

  pending_alert_title: string;
  pending_alert_description: string;
  pending_alert_button_label: string;
  pending_alert_button_loading_label: string;

  reference_label: string;
  date_label: string;
  shipping_section_title: string;
  recipient_label: string;
  courier_label: string;
  resi_label: string;
  items_section_title: string;
  total_label: string;

  status_labels: CekOrderStatusLabel[];   // length = 6
  timeline_steps: CekOrderTimelineStep[]; // default length = 5

  updated_at?: string;                    // ISO string, di-set backend
}
```

### 1.4 Response shape (GET)

`200 OK`

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "hero_badge": "Lacak Kiriman",
    "hero_title_1": "Lacak Status",
    "hero_title_2": "Pesanan Anda",
    "hero_subtitle": "Masukkan Kode Transaksi (contoh: TRX-2025...) ...",
    "search_placeholder": "Masukkan Kode Transaksi...",
    "search_button_label": "Lacak",
    "search_button_loading_label": "Mencari...",
    "loading_text": "Sedang mencari data transaksi...",
    "initial_title": "Belum Melacak Pesanan?",
    "initial_description": "Silakan masukkan <strong>Kode Referensi (TRX-...)</strong> ...",
    "initial_info_cards": [
      { "title": "1. Masukkan Kode", "description": "Input kode transaksi dengan benar." },
      { "title": "2. Cek Status",    "description": "Lihat posisi terkini paket Anda." },
      { "title": "3. Selesai",       "description": "Paket diterima dengan aman." }
    ],
    "not_found_title": "Data Tidak Ditemukan",
    "not_found_description": "Maaf, kami tidak dapat menemukan data transaksi dengan kode {code}",
    "not_found_tips_title": "Tips Pencarian:",
    "not_found_tips": [
      "Pastikan kode transaksi sudah benar (Case Sensitive).",
      "Periksa kembali email konfirmasi pesanan Anda.",
      "Hubungi admin jika Anda yakin sudah membayar."
    ],
    "pending_alert_title": "Menunggu Pembayaran",
    "pending_alert_description": "Pesanan belum dibayar. Silakan upload bukti transfer.",
    "pending_alert_button_label": "Bayar Sekarang",
    "pending_alert_button_loading_label": "Menyiapkan...",
    "reference_label": "Kode Transaksi",
    "date_label": "Tanggal Pemesanan",
    "shipping_section_title": "Informasi Pengiriman",
    "recipient_label": "Penerima",
    "courier_label": "Ekspedisi",
    "resi_label": "No. Resi",
    "items_section_title": "Detail Produk",
    "total_label": "Total Belanja",
    "status_labels": [
      { "key": "PENDING",   "label": "PENDING",   "description": "Pesanan dibuat, menunggu pembayaran" },
      { "key": "PAID",      "label": "PAID",      "description": "Pembayaran diterima" },
      { "key": "PROCESSED", "label": "PROCESSED", "description": "Pesanan sedang diproses" },
      { "key": "SHIPPED",   "label": "SHIPPED",   "description": "Paket dikirim" },
      { "key": "COMPLETED", "label": "COMPLETED", "description": "Pesanan selesai" },
      { "key": "CANCELLED", "label": "CANCELLED", "description": "Pesanan dibatalkan" }
    ],
    "timeline_steps": [
      { "key": "PENDING",   "label": "Dibuat" },
      { "key": "PAID",      "label": "Dibayar" },
      { "key": "PROCESSED", "label": "Diproses" },
      { "key": "SHIPPED",   "label": "Dikirim" },
      { "key": "COMPLETED", "label": "Selesai" }
    ],
    "updated_at": "2026-05-11T07:30:00Z"
  }
}
```

### 1.5 Request payload (PUT/POST)

FE mengirim **dua kemungkinan** body — backend harus terima keduanya.

**Opsi A — JSON (default)**

`Content-Type: application/json`

Body = full object `CekOrderContent` (tanpa `updated_at`).

```json
{
  "hero_badge": "Lacak Kiriman",
  "hero_title_1": "Lacak Status",
  "...": "..."
}
```

**Opsi B — multipart/form-data** (jika kelak butuh upload media)

Field utama: `content` berisi `JSON.stringify(payload)`. Field lain bebas
untuk file (saat ini cek-order tidak punya field gambar, jadi opsi A cukup).

### 1.6 Validasi backend yang disarankan

- Semua field `string` wajib (kecuali `updated_at`).
- `initial_info_cards`: minimal 1 item, tiap item butuh `title` & `description`.
- `not_found_tips`: array of strings (boleh kosong).
- `status_labels`: harus mencakup ke-6 key (`PENDING..CANCELLED`); validasi enum.
- `timeline_steps`: array minimal 1; tiap item `key` harus salah satu OrderStatusKey.

---

## 2. Halaman `/how-to-order`

### 2.1 Endpoint

| Method | URL                                  | Auth   | Deskripsi                              |
| ------ | ------------------------------------ | ------ | -------------------------------------- |
| GET    | `/api/v1/public/how-to-order-content` | Public | Mengambil konten halaman publik        |
| GET    | `/api/v1/web/how-to-order-content`    | Admin  | Mengambil konten untuk editor admin    |
| PUT    | `/api/v1/web/how-to-order-content`    | Admin  | Memperbarui konten (singleton, no id)  |

> Backend boleh menerima `POST` dengan `_method=PUT` — FE sudah memakai pola ini.

### 2.2 Catatan model data

Singleton (1 record). Saran: simpan sebagai 1 dokumen JSON di tabel
`settings` (`key="how_to_order_content"`) atau buat tabel khusus
`how_to_order_contents` dengan kolom `content JSON`.

### 2.3 Schema (TypeScript reference)

```ts
type IconKey =
  | "Shield" | "Truck" | "HeadphonesIcon" | "ShoppingCart"
  | "CreditCard" | "User" | "Package" | "CheckCircle"
  | "Sparkles" | "MessageCircle" | "Mail" | "Star"
  | "Ruler" | "Clock" | "Play";

interface BgConfig {
  type: "solid" | "gradient" | "image";
  color1: string;            // hex
  color2?: string | null;    // hex (jika gradient)
  image_url?: string | null; // url (jika type=image)
}

interface Benefit       { icon: IconKey; title: string; description: string; }
interface PaymentMethod { emoji: string; title: string; description: string; }
interface ContactItem   { icon: IconKey; title: string; value: string; }
interface FaqItem       { question: string; answer: string; }

interface HowToOrderStep {
  id: number;          // urutan tampil
  icon: IconKey;
  title: string;
  description: string;
  image_url: string;   // URL absolute / path relatif (mis. /images/.../step-1.png)
  details: string[];
  tips: string[];
}

interface HowToOrderContent {
  hero_bg: BgConfig;
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;
  benefits: Benefit[];

  steps_bg: BgConfig;
  steps_header_title: string;
  steps_header_subtitle: string;
  steps: HowToOrderStep[];

  payment_bg: BgConfig;
  payment_title: string;
  payment_subtitle: string;
  payment_methods: PaymentMethod[];
  security_title: string;
  security_description: string;

  contact_bg: BgConfig;
  contact_title: string;
  contact_subtitle: string;
  contact_items: ContactItem[];

  cta_bg: BgConfig;
  cta_title: string;
  cta_subtitle: string;
  cta_button_primary_label: string;
  cta_button_primary_url: string;
  cta_button_secondary_label: string;
  cta_button_secondary_url: string;

  faq_bg: BgConfig;
  faq_title: string;
  faq_subtitle: string;
  faqs: FaqItem[];

  updated_at?: string;
}
```

### 2.4 Response shape (GET)

`200 OK`

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "hero_bg": { "type": "solid", "color1": "#ffffff", "color2": null, "image_url": null },
    "hero_badge": "Ordering Guide",
    "hero_title_1": "How To Order From",
    "hero_title_2": "BLACKBOX.INC",
    "hero_subtitle": "Follow our 6 simple steps to ...",
    "benefits": [
      { "icon": "Shield", "title": "Secure Payment", "description": "Protected by SSL encryption and Doku." },
      { "icon": "Truck",  "title": "Fast Shipping",  "description": "2-5 working days with real-time tracking." },
      { "icon": "HeadphonesIcon", "title": "Expert Support", "description": "Dedicated team ready to assist 24/7." }
    ],

    "steps_bg": { "type": "solid", "color1": "#ffffff" },
    "steps_header_title": "The 6 Steps Process",
    "steps_header_subtitle": "A straightforward and secure journey ...",
    "steps": [
      {
        "id": 1,
        "icon": "Ruler",
        "title": "Pilih Gaya & Ukuran",
        "description": "Jelajahi koleksi eksklusif kami ...",
        "image_url": "/images/new/order-steps/step-1.png",
        "details": [
          "Browse kategori (T-Shirt, Denim, Aksesori, dll.)",
          "Gunakan fitur 'Size Guide' untuk memastikan fitting yang sempurna"
        ],
        "tips": [
          "Selalu cek Size Guide untuk menghindari retur"
        ]
      }
    ],

    "payment_bg": { "type": "solid", "color1": "#ffffff" },
    "payment_title": "Secure Payment Methods",
    "payment_subtitle": "Your transaction safety is our priority. Powered by Doku.",
    "payment_methods": [
      { "emoji": "🏦", "title": "Transfer Bank", "description": "BCA, Mandiri, BNI" }
    ],
    "security_title": "100% Security Guarantee",
    "security_description": "All transactions are secured ...",

    "contact_bg": { "type": "solid", "color1": "#ffffff" },
    "contact_title": "Need Assistance?",
    "contact_subtitle": "Our dedicated support team ...",
    "contact_items": [
      { "icon": "MessageCircle", "title": "Live Chat WA", "value": "0895 6227 17884" }
    ],

    "cta_bg": { "type": "solid", "color1": "#ffffff" },
    "cta_title": "Ready To Define Your Style?",
    "cta_subtitle": "Explore our exclusive collection ...",
    "cta_button_primary_label": "Shop Now",
    "cta_button_primary_url": "/product",
    "cta_button_secondary_label": "Watch Brand Video",
    "cta_button_secondary_url": "#",

    "faq_bg": { "type": "solid", "color1": "#ffffff" },
    "faq_title": "Frequently Asked Questions",
    "faq_subtitle": "Find quick answers ...",
    "faqs": [
      { "question": "Berapa lama estimasi pengiriman standar?", "answer": "Estimasi 2-5 hari kerja ..." }
    ],

    "updated_at": "2026-05-11T07:30:00Z"
  }
}
```

### 2.5 Request payload (PUT/POST)

FE saat ini mengirim **JSON body** penuh (Opsi A), tapi backend disarankan
juga mendukung **multipart/form-data** (Opsi B) untuk upload gambar step
langsung tanpa harus melalui UploadThing.

**Opsi A — JSON (default, FE saat ini)**

`Content-Type: application/json`

```json
{
  "hero_bg": { "type": "solid", "color1": "#ffffff" },
  "hero_badge": "Ordering Guide",
  "...": "...",
  "steps": [
    { "id": 1, "icon": "Ruler", "title": "...", "image_url": "/images/.../step-1.png", "...": "..." }
  ]
}
```

**Opsi B — multipart/form-data (opsional, untuk upload native)**

| Field                          | Type   | Wajib | Catatan                                                |
| ------------------------------ | ------ | ----- | ------------------------------------------------------ |
| `content`                      | string | Ya    | `JSON.stringify(HowToOrderContent)`                    |
| `media[step_<id>]`             | File   | Tidak | Upload gambar untuk step dengan id tertentu            |
| `media[hero_bg_image]`         | File   | Tidak | Upload background image hero                           |
| `media[steps_bg_image]`        | File   | Tidak | Upload background image section steps                  |
| `media[payment_bg_image]`      | File   | Tidak | Upload background image section payment                |
| `media[contact_bg_image]`      | File   | Tidak | Upload background image section contact                |
| `media[cta_bg_image]`          | File   | Tidak | Upload background image section CTA                    |
| `media[faq_bg_image]`          | File   | Tidak | Upload background image section FAQ                    |

Backend menyimpan file, lalu menggantikan field URL terkait pada `content`
(`steps[].image_url`, `*_bg.image_url`) dengan URL hasil upload, sebelum
mengembalikan content lengkap di response.

### 2.6 Validasi backend yang disarankan

- `*_bg.type` ∈ `["solid", "gradient", "image"]`.
- `benefits.icon`, `steps.icon`, `contact_items.icon` ∈ daftar `IconKey`.
- `steps`: minimal 1 item; setiap item butuh `id`, `title`, `description`.
  Validasi `id` unik per record.
- `faqs`, `payment_methods`, `contact_items`: array (boleh kosong, tapi
  disarankan minimal 1).

---

## 3. Error Format (kedua endpoint)

`422 Unprocessable Entity` (validasi):

```json
{
  "code": 422,
  "message": "Validation failed",
  "errors": {
    "hero_title_1": ["Field hero_title_1 is required."]
  }
}
```

`401 Unauthorized` (admin endpoint tanpa token):

```json
{ "code": 401, "message": "Unauthenticated." }
```

`500 Internal Server Error`:

```json
{ "code": 500, "message": "Internal server error" }
```

---

## 4. Migration Hint (Laravel)

```php
// Saran skema sederhana (1 baris per halaman):

Schema::create('page_contents', function (Blueprint $t) {
    $t->id();
    $t->string('slug')->unique();   // 'cek-order' | 'how-to-order'
    $t->json('content');
    $t->timestamps();
});
```

Controller routing:

```php
// routes/api.php
Route::prefix('public')->group(function () {
    Route::get('/cek-order-content',     [PageContentController::class, 'cekOrder']);
    Route::get('/how-to-order-content',  [PageContentController::class, 'howToOrder']);
});

Route::prefix('web')->middleware('auth:sanctum')->group(function () {
    Route::get('/cek-order-content',     [PageContentController::class, 'getCekOrder']);
    Route::put('/cek-order-content',     [PageContentController::class, 'updateCekOrder']);

    Route::get('/how-to-order-content',  [PageContentController::class, 'getHowToOrder']);
    Route::put('/how-to-order-content',  [PageContentController::class, 'updateHowToOrder']);
});
```

> Karena FE mengirim `POST` dengan `?_method=PUT`, pastikan
> `\Illuminate\Http\Middleware\HandleCors` dan
> `Illuminate\Routing\Middleware\ValidatePostSize` aktif, dan route `PUT`
> sudah didefinisikan (Laravel akan otomatis route ke handler PUT).

---

## 5. FE Reference

| File FE                                                          | Peran                          |
| ---------------------------------------------------------------- | ------------------------------ |
| `types/admin/cek-order-content.ts`                               | Schema TS + DEFAULT konten     |
| `types/admin/how-to-order-content.ts`                            | Schema TS + DEFAULT konten     |
| `services/admin/cek-order-content.service.ts`                    | RTK admin (GET, PUT)           |
| `services/admin/how-to-order-content.service.ts`                 | RTK admin (GET, PUT)           |
| `services/public-cek-order-content.service.ts`                   | RTK public (GET)               |
| `services/public-how-to-order-content.service.ts`                | RTK public (GET)               |
| `app/admin/cek-order-content/page.tsx`                           | Editor admin Cek Order         |
| `app/admin/how-to-order-content/page.tsx`                        | Editor admin How to Order      |
| `app/(pages)/cek-order/page.tsx`                                 | Halaman publik                 |
| `app/(pages)/how-to-order/page.tsx`                              | Halaman publik                 |

Selama backend belum siap, FE akan otomatis fallback ke `DEFAULT_*_CONTENT`
(merge dengan response — field yang tidak dikirim backend dipakai dari
default).
