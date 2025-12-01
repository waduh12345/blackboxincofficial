"use client";

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Heart,
  ArrowLeft,
  CreditCard,
  Sparkles,
  Truck,
  Star,
} from "lucide-react";

import {
  useCreatePublicTransactionMutation,
  type CreatePublicTransactionRequest,
} from "@/services/public-transactions.service";
import { useCheckShippingCostQuery } from "@/services/auth.service";
import { useGetProductListQuery } from "@/services/product.service";

import {
  useGetProvincesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
} from "@/services/shop/open-shop/open-shop.service";

import VoucherPicker from "@/components/voucher-picker";
import PaymentMethod from "@/components/payment-method";
import type { Voucher } from "@/types/voucher";
import type { Product } from "@/types/admin/product";
import { fredoka, sniglet } from "@/lib/fonts";
import { Combobox } from "@/components/ui/combo-box";
import DotdLoader from "@/components/loader/3dot";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/** ====== Helpers & Types ====== */
const STORAGE_KEY = "cart-storage";

type StoredCartItem = Product & { quantity: number };

interface CartItemView {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  category: string;
  ageGroup: string;
  isEcoFriendly: boolean;
  inStock: boolean;
}

interface RelatedProductView {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  category: string;
  __raw: Product;
}

interface ShippingCostOption {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

type PaymentType = "automatic" | "manual" | "cod";

function parseStorage(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const items: unknown = parsed?.state?.cartItems;
    return Array.isArray(items) ? (items as StoredCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(nextItems: StoredCartItem[]) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEY);
  let base = {
    state: { cartItems: [] as StoredCartItem[] },
    version: 0 as number,
  };
  try {
    base = raw ? JSON.parse(raw) : base;
  } catch {}
  base.state = { ...(base.state || {}), cartItems: nextItems };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
  window.dispatchEvent(new CustomEvent("cartUpdated"));
}

function getImageUrlFromProduct(p: Product): string {
  if (typeof p.image === "string" && p.image) return p.image;
  const media = (p as unknown as { media?: Array<{ original_url: string }> })
    ?.media;
  if (Array.isArray(media) && media[0]?.original_url)
    return media[0].original_url;
  return "/api/placeholder/300/300";
}

function mapStoredToView(items: StoredCartItem[]): CartItemView[] {
  return items.map((it) => ({
    id: it.id,
    product_variant_id: it.product_variant_id ?? 0,
    name: it.name,
    price: it.price,
    originalPrice: undefined,
    image: getImageUrlFromProduct(it),
    quantity: it.quantity ?? 1,
    category: it.category_name,
    ageGroup: "Semua usia",
    isEcoFriendly: false,
    inStock: (it.stock ?? 0) > 0,
  }));
}

/** ====== Component ====== */
export default function PublicTransaction() {
  /** ——— Cart Logic ——— */
  const [cartItems, setCartItems] = useState<CartItemView[]>([]);

  useEffect(() => {
    const sync = () => setCartItems(mapStoredToView(parseStorage()));
    sync();
    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", onStorage);
    };
  }, []);

  const updateStorageAndState = (
    updater: (items: StoredCartItem[]) => StoredCartItem[]
  ) => {
    const current = parseStorage();
    const next = updater(current);
    writeStorage(next);
    setCartItems(mapStoredToView(next));
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    updateStorageAndState((items) =>
      items.map((it) => (it.id === id ? { ...it, quantity: newQuantity } : it))
    );
  };

  const removeItem = (id: number) => {
    updateStorageAndState((items) => items.filter((it) => it.id !== id));
  };

  const clearCart = () => {
    writeStorage([]);
    setCartItems([]);
  };

  const {
    data: relatedResp,
    isLoading: isRelLoading,
    isError: isRelError,
  } = useGetProductListQuery({
    page: 1,
    paginate: 6,
  });

  const relatedProducts: RelatedProductView[] = useMemo(() => {
    const arr = relatedResp?.data ?? [];
    return arr.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: undefined,
      image: getImageUrlFromProduct(p),
      rating:
        typeof p.rating === "number"
          ? p.rating
          : parseFloat(p.rating || "0") || 0,
      category: p.category_name,
      __raw: p,
    }));
  }, [relatedResp]);

  const addRelatedToCart = (p: Product) => {
    updateStorageAndState((items) => {
      const found = items.find((it) => it.id === p.id);
      if (found) {
        return items.map((it) =>
          it.id === p.id ? { ...it, quantity: (it.quantity ?? 1) + 1 } : it
        );
      }
      const fresh: StoredCartItem = { ...p, quantity: 1 };
      return [...items, fresh];
    });
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Produk ditambahkan ke keranjang",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  /** ——— Guest Form State ——— */
  const [guest, setGuest] = useState({
    address_line_1: "Jl Kebon Kopi",
    address_line_2: "",
    postal_code: "40535",
    guest_name: "Test Guest",
    guest_email: "akmalrafly875@gmail.com",
    guest_phone: "08954058734653",
    rajaongkir_province_id: 0,
    rajaongkir_city_id: 0,
    rajaongkir_district_id: 0,
  });

  /** ——— Regional Data ——— */
  const { data: provinces = [], isLoading: provLoading } =
    useGetProvincesQuery();
  const { data: cities = [], isLoading: cityLoading } = useGetCitiesQuery(
    guest.rajaongkir_province_id,
    { skip: !guest.rajaongkir_province_id }
  );
  const { data: districts = [], isLoading: distLoading } = useGetDistrictsQuery(
    guest.rajaongkir_city_id,
    { skip: !guest.rajaongkir_city_id }
  );

  useEffect(() => {
    setGuest((s) => ({
      ...s,
      rajaongkir_city_id: 0,
      rajaongkir_district_id: 0,
    }));
  }, [guest.rajaongkir_province_id]);

  useEffect(() => {
    setGuest((s) => ({ ...s, rajaongkir_district_id: 0 }));
  }, [guest.rajaongkir_city_id]);

  const canChooseCourier = Boolean(
    guest.rajaongkir_district_id ||
      (guest.address_line_1.trim() && guest.postal_code.trim())
  );

  /** ——— Shipping Logic ——— */
  const [shippingCourier, setShippingCourier] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingCostOption | null>(null);

  useEffect(() => {
    setShippingCourier(null);
    setShippingMethod(null);
  }, [
    guest.address_line_1,
    guest.postal_code,
    guest.rajaongkir_province_id,
    guest.rajaongkir_city_id,
    guest.rajaongkir_district_id,
  ]);

  const {
    data: shippingOptions = [],
    isLoading: isShippingLoading,
    isError: isShippingError,
  } = useCheckShippingCostQuery(
    {
      shop_id: 1,
      destination: guest.rajaongkir_district_id
        ? String(guest.rajaongkir_district_id)
        : guest.postal_code,
      weight: 1000,
      height: 10,
      length: 10,
      width: 10,
      diameter: 10,
      courier: shippingCourier ?? "",
    },
    {
      skip: !canChooseCourier || !shippingCourier,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (!isShippingLoading && shippingOptions.length > 0) {
      setShippingMethod(shippingOptions[0]);
    } else {
      setShippingMethod(null);
    }
  }, [shippingOptions, isShippingLoading]);

  /** ——— Payment & Voucher ——— */
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>("manual");

  const subtotal = cartItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher) return 0;
    if (selectedVoucher.type === "fixed") {
      const cut = Math.max(0, selectedVoucher.fixed_amount);
      return Math.min(cut, subtotal);
    }
    const pct = Math.max(0, selectedVoucher.percentage_amount);
    return Math.round((subtotal * pct) / 100);
  }, [selectedVoucher, subtotal]);

  const discount = voucherDiscount;
  const shippingCost = shippingMethod?.cost ?? 0;
  const total = subtotal - discount + shippingCost;

  /** ——— Checkout Action ——— */
  const [createPublicTransaction, { isLoading: isCreating }] =
    useCreatePublicTransactionMutation();

  const onCheckout = async () => {
    if (
      !guest.address_line_1 ||
      !guest.postal_code ||
      !guest.guest_name ||
      !guest.guest_email ||
      !guest.guest_phone ||
      !shippingCourier ||
      !shippingMethod
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Lengkapi Data",
        text: "Mohon isi semua field yang wajib.",
      });
      return;
    }

    if (cartItems.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Keranjang Kosong",
        text: "Tambahkan produk terlebih dahulu.",
      });
      return;
    }

    const stored = parseStorage();
    const details = stored.map((item) => ({
      product_id: item.id,
      product_variant_id: item.product_variant_id ?? undefined,
      quantity: item.quantity ?? 1,
    }));

    const payload: CreatePublicTransactionRequest = {
      address_line_1: guest.address_line_1,
      address_line_2: guest.address_line_2 || "",
      postal_code: guest.postal_code,
      guest_name: guest.guest_name,
      guest_email: guest.guest_email,
      guest_phone: guest.guest_phone,
      payment_type: paymentMethod,
      data: [
        {
          shop_id: 1,
          details,
          shipment: {
            parameter: JSON.stringify({
              destination: guest.rajaongkir_district_id
                ? String(guest.rajaongkir_district_id)
                : guest.postal_code,
              weight: 1000,
              height: 0,
              length: 0,
              width: 0,
              diameter: 0,
              courier: shippingCourier ?? "",
            }),
            shipment_detail: JSON.stringify(shippingMethod),
            courier: shippingCourier ?? "",
            cost: shippingMethod.cost,
          },
        },
      ],
      voucher: selectedVoucher ? [selectedVoucher.id] : undefined,
    };

    try {
      const res = await createPublicTransaction(payload).unwrap();
      if (res && typeof res.data === "object" && "payment_link" in res.data) {
        await Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat",
          text: "Kami arahkan ke halaman pembayaran.",
          confirmButtonText: "Lanjut",
        });
        window.open(
          (res.data as { payment_link: string }).payment_link,
          "_blank"
        );
        clearCart();
      } else {
        await Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat",
          text: " Untuk informasi lebih lanjut bisa melalui WhatsApp,email, dan menu track order lalu masukan code transaksi yang dikirim melalui email atau WhatsApp",
        });
        clearCart();
      }
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: "error",
        title: "Gagal Membuat Transaksi",
        text: "Silakan coba lagi.",
      });
    }
  };

  /** ——— Render Empty State ——— */
  if (cartItems.length === 0) {
    return (
      <div
        className={`min-h-screen w-full bg-gradient-to-br from-white to-[#000000]/10 pt-24 ${sniglet.className}`}
      >
        <div className="container mx-auto px-6">
          <div className="mx-auto text-center py-20">
            <div className="w-32 h-32 bg-[#000000]/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="w-16 h-16 text-[#000000]" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              Keranjang Kosong
            </h1>
            <p className="text-xl text-black mb-8">
              Belum ada produk kreatif di keranjang Anda. Yuk, jelajahi koleksi
              produk ramah lingkungan kami!
            </p>
            <a
              href="/product"
              className="inline-flex bg-[#000000] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Mulai Berbelanja
            </a>

            <div className="mt-16">
              <h2
                className={`text-2xl font-bold text-black mb-6 ${fredoka.className}`}
              >
                Produk Rekomendasi
              </h2>
              {isRelLoading && (
                <div className="text-black w-full flex items-center justify-center min-h-96">
                  <DotdLoader />
                </div>
              )}
              {isRelError && (
                <div className="text-red-600">Gagal memuat rekomendasi.</div>
              )}
              {!isRelLoading && !isRelError && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                    >
                      <div className="relative h-48">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                          <Heart className="w-4 h-4 text-black hover:text-red-500" />
                        </button>
                      </div>
                      <div className="p-6">
                        <span className="text-sm text-[#000000] font-medium">
                          {product.category}
                        </span>
                        <h3 className="text-lg font-bold text-black mt-1 mb-3">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(product.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-black">
                            ({product.rating.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xl font-bold text-[#000000]">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex gap-2 bg-[#000000] rounded-2xl">
                          <button
                            onClick={() => addRelatedToCart(product.__raw)}
                            className="w-full bg-[#000000] text-white py-3 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Tambah ke Keranjang
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-white to-[#000000]/10 pt-24 ${sniglet.className}`}
    >
      <div className="container mx-auto px-6 lg:px-12 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <a
              href="/product"
              className="flex items-center gap-2 text-black hover:text-[#000000] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Lanjut Belanja
            </a>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#000000]/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#000000]" />
              <span className="text-sm font-medium text-[#000000]">
                Checkout Publik
              </span>
            </div>
            <h1
              className={`text-4xl lg:text-5xl font-bold text-black mb-4 ${fredoka.className}`}
            >
              Produk <span className="text-[#000000]">Pilihan Anda</span>
            </h1>
            <p className="text-black max-w-2xl mx-auto">
              Selesaikan pesanan tanpa perlu login
            </p>
          </div>
        </div>

        {/* MAIN LAYOUT GRID (3 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- KOLOM KIRI --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Cart Items */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-2xl"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          Stok Habis
                        </span>
                      </div>
                    )}
                    {item.isEcoFriendly && (
                      <div className="absolute top-2 left-2 bg-[#DFF19D] text-gray-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Eco
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div>
                        <span className="text-sm text-[#000000] font-medium">
                          {item.category}
                        </span>
                        <h3 className="text-lg font-bold text-black mt-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-black">
                          Untuk anak {item.ageGroup}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button
                          className="p-2 text-black hover:text-red-500 transition-colors"
                          title="Wishlist"
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-black hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#000000]">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                        {item.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            Rp {item.originalPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-2xl">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={!item.inStock}
                            className="p-2 hover:bg-gray-200 rounded-l-2xl transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={!item.inStock}
                            className="p-2 hover:bg-gray-200 rounded-r-2xl transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-black">
                            Rp{" "}
                            {(item.price * item.quantity).toLocaleString(
                              "id-ID"
                            )}
                          </div>
                          {!item.inStock && (
                            <div className="text-xs text-red-500">
                              Tidak tersedia
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 2. Informasi Pengiriman (Form Guest) */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#000000]" />
                Informasi Pengiriman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.guest_name}
                    onChange={(e) =>
                      setGuest((s) => ({ ...s, guest_name: e.target.value }))
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Nomor Telepon *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.guest_phone}
                    onChange={(e) =>
                      setGuest((s) => ({ ...s, guest_phone: e.target.value }))
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.guest_email}
                    onChange={(e) =>
                      setGuest((s) => ({ ...s, guest_email: e.target.value }))
                    }
                    placeholder="email@contoh.com"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.address_line_1}
                    onChange={(e) =>
                      setGuest((s) => ({
                        ...s,
                        address_line_1: e.target.value,
                      }))
                    }
                    placeholder="Nama jalan, RT/RW"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Alamat Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.address_line_2}
                    onChange={(e) =>
                      setGuest((s) => ({
                        ...s,
                        address_line_2: e.target.value,
                      }))
                    }
                    placeholder="Patokan atau detail lain"
                  />
                </div>

                {/* Provinsi */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Provinsi
                  </label>
                  <Combobox
                    value={guest.rajaongkir_province_id || null}
                    onChange={(id) => {
                      setGuest((s) => ({
                        ...s,
                        rajaongkir_province_id: id,
                        rajaongkir_city_id: 0,
                        rajaongkir_district_id: 0,
                      }));
                      setShippingCourier(null);
                      setShippingMethod(null);
                    }}
                    data={provinces}
                    isLoading={provLoading}
                    placeholder="Pilih Provinsi"
                    getOptionLabel={(item: { id: number; name: string }) =>
                      item.name
                    }
                  />
                </div>

                {/* Kabupaten / Kota */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Kabupaten / Kota
                  </label>
                  <Combobox
                    value={guest.rajaongkir_city_id || null}
                    onChange={(id) => {
                      setGuest((s) => ({
                        ...s,
                        rajaongkir_city_id: id,
                        rajaongkir_district_id: 0,
                      }));
                      setShippingCourier(null);
                      setShippingMethod(null);
                    }}
                    data={cities}
                    isLoading={cityLoading}
                    placeholder="Pilih Kab/Kota"
                    getOptionLabel={(item: { id: number; name: string }) =>
                      item.name
                    }
                    disabled={!guest.rajaongkir_province_id}
                  />
                </div>

                {/* Kecamatan */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Kecamatan
                  </label>
                  <Combobox
                    value={guest.rajaongkir_district_id || null}
                    onChange={(id) => {
                      setGuest((s) => ({ ...s, rajaongkir_district_id: id }));
                      setShippingCourier(null);
                      setShippingMethod(null);
                    }}
                    data={districts}
                    isLoading={distLoading}
                    placeholder="Pilih Kecamatan"
                    getOptionLabel={(item: { id: number; name: string }) =>
                      item.name
                    }
                    disabled={!guest.rajaongkir_city_id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Kode Pos *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent"
                    value={guest.postal_code}
                    onChange={(e) =>
                      setGuest((s) => ({ ...s, postal_code: e.target.value }))
                    }
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>

            {/* 3. Metode Pengiriman (Kurir) */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-black mb-4">Metode Pengiriman</h3>
              <div className="mb-4">
                <label className="block w-full text-sm font-medium text-black mb-2">
                  Pilih Kurir
                </label>
                <Select
                  value={shippingCourier ?? ""}
                  onValueChange={(val) => {
                    setShippingCourier(val);
                    setShippingMethod(null);
                  }}
                  disabled={!canChooseCourier}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jne">JNE</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="tiki">TIKI</SelectItem>
                  </SelectContent>
                </Select>

                {!canChooseCourier && (
                  <p className="text-sm text-red-500 mt-1">
                    Lengkapi kecamatan atau alamat & kode pos untuk memilih
                    kurir.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {isShippingLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <DotdLoader />
                  </div>
                ) : isShippingError ? (
                  <p className="text-center text-red-500">
                    Gagal memuat opsi pengiriman.
                  </p>
                ) : shippingOptions.length > 0 ? (
                  shippingOptions.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        shippingMethod?.service === option.service
                          ? "border-[#000000] bg-[#000000]/30"
                          : "border-gray-200 hover:bg-neutral-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-service"
                        checked={shippingMethod?.service === option.service}
                        onChange={() => setShippingMethod(option)}
                        className="form-radio text-[#000000] h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{option.service}</p>
                        <p className="text-sm text-neutral-500">
                          {option.description}
                        </p>
                        <p className="text-sm font-semibold">
                          Rp {option.cost.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Estimasi: {option.etd}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  canChooseCourier &&
                  shippingCourier && (
                    <p className="text-center text-gray-500">
                      Tidak ada opsi pengiriman tersedia.
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* --- KOLOM KANAN (Sticky) --- */}
          <div className="lg:col-span-1 space-y-6 sticky top-24">
            {/* 1. Voucher Picker */}
            <VoucherPicker
              selected={selectedVoucher}
              onChange={setSelectedVoucher}
            />

            {/* 2. Metode Pembayaran */}
            <PaymentMethod
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
            />

            {/* 3. Ringkasan Pesanan */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-black mb-4">Ringkasan Pesanan</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-black">
                    Subtotal ({cartItems.length} produk)
                  </span>
                  <span className="font-semibold">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Diskon{" "}
                      {selectedVoucher?.code
                        ? `(${selectedVoucher.code})`
                        : "Voucher"}
                    </span>
                    <span>- Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-black">Ongkos Kirim</span>
                  <span className="font-semibold">
                    Rp {shippingCost.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#000000]">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onCheckout}
                disabled={
                  isCreating ||
                  cartItems.some((it) => !it.inStock) ||
                  !guest.address_line_1 ||
                  !guest.postal_code ||
                  !guest.guest_name ||
                  !guest.guest_email ||
                  !guest.guest_phone ||
                  !shippingCourier ||
                  !shippingMethod
                }
                className="w-full bg-[#000000] text-white py-4 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bayar Sekarang
                  </>
                )}
              </button>

              {(!shippingMethod ||
                !shippingCourier ||
                !guest.guest_name ||
                !guest.address_line_1) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  * Harap lengkapi semua informasi yang diperlukan
                </p>
              )}

              {cartItems.some((it) => !it.inStock) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  Beberapa produk tidak tersedia. Hapus untuk melanjutkan.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Produk Rekomendasi */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Produk <span className="text-[#000000]">Rekomendasi</span>
            </h2>
            <p className="text-black max-w-2xl mx-auto">
              Lengkapi koleksi kreatif si kecil dengan produk pilihan lainnya
            </p>
          </div>
          {isRelLoading && (
            <div className="text-center text-black">
              <DotdLoader />
            </div>
          )}
          {isRelError && (
            <div className="text-center text-red-600">
              Gagal memuat rekomendasi.
            </div>
          )}
          {!isRelLoading && !isRelError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className="relative h-48">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-black hover:text-red-500" />
                    </button>
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-[#000000] font-medium">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-bold text-black mt-1 mb-3">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(product.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-black">
                        ({product.rating.toFixed(1)})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl font-bold text-[#000000]">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          Rp {product.originalPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 bg-[#000000] rounded-2xl">
                      <button
                        onClick={() => addRelatedToCart(product.__raw)}
                        className="w-full bg-[#000000] text-white py-3 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah ke Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}