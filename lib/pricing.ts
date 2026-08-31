/**
 * Harga & stok produk bisa diisi di tiga level: produk -> varian -> ukuran.
 * Level yang masih 0 berarti "belum diisi" dan mewarisi level di atasnya —
 * bukan berarti gratis, dan bukan untuk dijumlahkan.
 *
 * Aturan ini harus sama persis dengan API (Product::pricingSummary dan
 * CheckoutController), supaya harga yang tampil sama dengan yang ditagihkan.
 */

type Numeric = number | string | null | undefined;

type PriceLevel = {
  price?: Numeric;
  harga_coret?: Numeric;
  stock?: Numeric;
  weight?: Numeric;
};

export const toNumber = (val: Numeric): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Ambil nilai pertama yang lebih dari 0, dari level terdalam ke terluar. */
const firstPositive = (...values: Numeric[]): number => {
  for (const value of values) {
    const n = toNumber(value);
    if (n > 0) return n;
  }
  return 0;
};

/** Harga satuan yang berlaku: ukuran -> varian -> produk. */
export const resolvePrice = (
  product?: PriceLevel | null,
  variant?: PriceLevel | null,
  size?: PriceLevel | null
): number => firstPositive(size?.price, variant?.price, product?.price);

/** Harga coret yang berlaku, mengikuti jenjang yang sama. */
export const resolveHargaCoret = (
  product?: PriceLevel | null,
  variant?: PriceLevel | null,
  size?: PriceLevel | null
): number =>
  firstPositive(size?.harga_coret, variant?.harga_coret, product?.harga_coret);

/** Berat yang berlaku, mengikuti jenjang yang sama. */
export const resolveWeight = (
  product?: PriceLevel | null,
  variant?: PriceLevel | null,
  size?: PriceLevel | null
): number => firstPositive(size?.weight, variant?.weight, product?.weight);

/**
 * Stok tidak diwarisi: 0 adalah angka yang sah (benar-benar habis).
 * Yang dipakai adalah level terdalam yang tersedia.
 */
export const resolveStock = (
  product?: PriceLevel | null,
  variant?: PriceLevel | null,
  size?: PriceLevel | null
): number => {
  if (size) return toNumber(size.stock);
  if (variant) return toNumber(variant.stock);
  return toNumber(product?.stock);
};
