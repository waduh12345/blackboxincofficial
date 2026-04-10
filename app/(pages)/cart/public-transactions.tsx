"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Sparkles,
  Truck,
  Upload,
  Shield,
  Package,
  Scale,
  Layers, // Icon untuk Variant
  Maximize2, // Icon untuk Size
} from "lucide-react";

// Hapus import mutation manual, ganti dengan hook useCheckout
import { useCheckShippingCostQuery } from "@/services/auth.service";
import { useGetProductListQuery } from "@/services/product.service";

import {
  useGetProvincesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
} from "@/services/shop/open-shop/open-shop.service";

import VoucherPicker from "@/components/voucher-picker";
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

// IMPORT ZUSTAND HOOK
import useCart, { CartItem } from "@/hooks/use-cart"; // Pastikan import CartItem type juga

// IMPORT USE CHECKOUT & TYPES
import { useCheckout } from "@/hooks/use-checkout";
import type { CheckoutDeps } from "@/types/checkout";
import PaymentMethodSelector from "@/components/payment-method";
import type { PaymentMethod, PaymentChannel } from "@/types/admin/transaction";

/** ====== Helpers & Types ====== */

// Kita tidak lagi butuh CartItemView manual karena pakai CartItem dari hook
// Tapi untuk konsistensi dengan kode lama, kita bisa pakai tipe CartItem langsung

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

const COD_SHIPPING_OPTIONS: ShippingCostOption[] = [
  {
    name: "COD",
    code: "cod-close",
    service: "COD Jarak Dekat",
    description: "Bayar di tempat - area terdekat",
    cost: 10000,
    etd: "1-2 hari",
  },
  {
    name: "COD",
    code: "cod-far",
    service: "COD Jarak Jauh",
    description: "Bayar di tempat - area jauh",
    cost: 25000,
    etd: "2-3 hari",
  },
];

const INTERNATIONAL_SHIPPING_OPTIONS: ShippingCostOption[] = [
  {
    name: "International",
    code: "intl-singapore",
    service: "Singapura",
    description: "Pengiriman internasional ke Singapura",
    cost: 85000,
    etd: "7-14 hari",
  },
  {
    name: "International",
    code: "intl-malaysia",
    service: "Malaysia",
    description: "Pengiriman internasional ke Malaysia",
    cost: 85000,
    etd: "7-14 hari",
  },
];

type PaymentType = "automatic" | "manual";

function getImageUrlFromProduct(p: Product): string {
  if (typeof p.image === "string" && p.image) return p.image;
  const media = (p as unknown as { media?: Array<{ original_url: string }> })
    ?.media;
  if (Array.isArray(media) && media[0]?.original_url)
    return media[0].original_url;
  return "/api/placeholder/300/300";
}

function formatWeight(grams: number): string {
  if (grams <= 0) return "";
  if (grams >= 1000) {
    const kg = grams / 1000;
    const formatted = Number.isInteger(kg)
      ? `${kg}`
      : kg.toFixed(2).replace(".", ",");
    return `${formatted} kg`;
  }
  return `${grams} gr`;
}

/** ====== Component ====== */
export default function PublicTransaction() {
  // --- Init Checkout Hook ---
  const { handleCheckout } = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);

  /** ——— Cart Logic (Menggunakan Zustand) ——— */
  const {
    cartItems, // Ini sudah array CartItem[] dari zustand
    removeItem,
    increaseItemQuantity,
    decreaseItemQuantity,
    addItem,
    clearCart,
  } = useCart();

  // Handle Hydration Mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- GROUPING LOGIC ---
  // Mengelompokkan item berdasarkan Product ID agar tampil dalam satu kartu
  // Struktur: { [productId]: { common: ProductInfo, items: [Variant1, Variant2] } }
  const groupedCartItems = useMemo(() => {
    if (!isMounted) return [];

    const groups: Record<number, { common: CartItem; items: CartItem[] }> = {};

    cartItems.forEach((item) => {
      if (!groups[item.id]) {
        groups[item.id] = {
          common: item, // Data umum produk (nama, gambar, kategori) diambil dari item pertama
          items: [], // Array untuk varian/size spesifik
        };
      }
      groups[item.id].items.push(item);
    });

    return Object.values(groups);
  }, [cartItems, isMounted]);

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
    // Gunakan addItem dari useCart, logic varian default akan dihandle di hook/modal (di sini asumsi simple product)
    addItem({ ...p, quantity: 1 });
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
    address_line_1: "",
    address_line_2: "",
    postal_code: "",
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    rajaongkir_province_id: 0,
    rajaongkir_city_id: 0,
    rajaongkir_district_id: 0,
  });

  // Validation State
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Refs untuk auto-focus ke field yang error
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const postalRef = useRef<HTMLInputElement>(null);

  function focusField(el: HTMLElement | null) {
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    setTimeout(() => el.focus(), 0);
  }

  const validatePhone = (phone: string) =>
    /^(?:\+62|62|0)8\d{8,11}$/.test(phone);
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    setIsPhoneValid(validatePhone(guest.guest_phone));
  }, [guest.guest_phone]);

  useEffect(() => {
    setIsEmailValid(validateEmail(guest.guest_email));
  }, [guest.guest_email]);

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

  /** ——— Shipping Logic ——— */
  const [shippingCourier, setShippingCourier] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingCostOption | null>(null);

  // Hitung total berat dari semua item di keranjang (berat × qty)
  const totalWeight = useMemo(() => {
    const w = cartItems.reduce((sum, it) => {
      const weight = typeof it.weight === "number" ? it.weight : 0;
      return sum + weight * it.quantity;
    }, 0);
    return w > 0 ? w : 1; // minimal 1 gram
  }, [cartItems]);

  // Logic from CartPage to determine options
  const getShippingOptions = (): ShippingCostOption[] => {
    if (shippingCourier === "cod") {
      return COD_SHIPPING_OPTIONS;
    } else if (shippingCourier === "international") {
      return INTERNATIONAL_SHIPPING_OPTIONS;
    }
    return apiShippingOptions;
  };

  const {
    data: apiShippingOptions = [],
    isLoading: isShippingLoading,
    isError: isShippingError,
  } = useCheckShippingCostQuery(
    {
      shop_id: 1,
      destination: guest.rajaongkir_district_id
        ? String(guest.rajaongkir_district_id)
        : guest.postal_code,
      weight: totalWeight,
      height: 10,
      length: 10,
      width: 10,
      diameter: 10,
      courier: shippingCourier ?? "",
    },
    {
      skip:
        !guest.rajaongkir_district_id ||
        !shippingCourier ||
        shippingCourier === "cod" ||
        shippingCourier === "international",
      refetchOnMountOrArgChange: true,
    }
  );

  const shippingOptions = getShippingOptions();

  useEffect(() => {
    if (shippingOptions.length > 0) {
      setShippingMethod(shippingOptions[0]);
    } else {
      setShippingMethod(null);
    }
  }, [shippingOptions]);

  /** ——— Payment & Voucher ——— */
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("manual");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel | undefined>(undefined);

  const subtotal = cartItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  const shippingCost = shippingMethod?.cost ?? 0;

  const discount = useMemo(() => {
    if (!selectedVoucher) return 0;
    const grandBeforeDiscount = subtotal + shippingCost;
    if (selectedVoucher.type === "fixed") {
      const cut = Math.max(0, selectedVoucher.fixed_amount);
      return Math.min(cut, grandBeforeDiscount);
    }
    const pct = Math.max(0, selectedVoucher.percentage_amount);
    return Math.min(Math.round((subtotal * pct) / 100), grandBeforeDiscount);
  }, [selectedVoucher, subtotal, shippingCost]);

  const total = Math.max(0, subtotal + shippingCost - discount);

  /** ——— Checkout Action (REFACTORED USING useCheckout) ——— */
  const onCheckout = async () => {
    // 1. Validasi Stock
    if (
      cartItems.some((it) => {
        const stock = typeof it.stock === "number" ? it.stock : 0;
        return stock <= 0;
      })
    ) {
      await Swal.fire({
        icon: "error",
        title: "Stok Habis",
        text: "Ada produk yang stoknya habis. Mohon hapus dari keranjang.",
      });
      return;
    }

    // 2. Validasi Form - field per field agar user tahu mana yang salah
    const errors: Record<string, string> = {};

    if (!guest.guest_name.trim()) {
      errors.guest_name = "Nama lengkap harus diisi";
    }

    if (!guest.guest_phone.trim()) {
      errors.guest_phone = "Nomor telepon harus diisi";
    } else if (!isPhoneValid) {
      errors.guest_phone =
        "Format tidak valid. Gunakan: 08xxxxxxxxxx atau +628xxxxxxxxxx";
    }

    if (!guest.guest_email.trim()) {
      errors.guest_email = "Email harus diisi";
    } else if (!isEmailValid) {
      errors.guest_email = "Format email tidak valid. Contoh: nama@email.com";
    }

    if (!guest.address_line_1.trim()) {
      errors.address_line_1 = "Alamat lengkap harus diisi";
    }

    if (!guest.postal_code.trim()) {
      errors.postal_code = "Kode pos harus diisi";
    }

    if (!shippingCourier) {
      errors.shipping = "Pilih kurir pengiriman terlebih dahulu";
    } else if (!shippingMethod) {
      errors.shipping = "Pilih layanan pengiriman";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Fokus otomatis ke field pertama yang error
      if (errors.guest_name) focusField(nameRef.current);
      else if (errors.guest_phone) focusField(phoneRef.current);
      else if (errors.guest_email) focusField(emailRef.current);
      else if (errors.address_line_1) focusField(addressRef.current);
      else if (errors.postal_code) focusField(postalRef.current);
      return;
    }

    setFieldErrors({});
    setIsProcessing(true);

    try {
      const deps: CheckoutDeps = {
        sessionEmail: null,
        shippingCourier,
        shippingMethod,
        shippingInfo: {
          fullName: guest.guest_name,
          email: guest.guest_email,
          phone: guest.guest_phone,
          address_line_1: guest.address_line_1,
          postal_code: guest.postal_code,
          address_line_2: guest.address_line_2,
          rajaongkir_province_id: guest.rajaongkir_province_id,
          rajaongkir_city_id: guest.rajaongkir_city_id,
          rajaongkir_district_id: guest.rajaongkir_district_id,
        },
        paymentType,
        paymentMethod,
        paymentChannel,
        clearCart,
        voucher: selectedVoucher ? [selectedVoucher.id] : [],
      };

      await handleCheckout(deps);
    } catch (e) {
      console.error(e);
      // Tampilkan pesan error yang jelas ke user (termasuk error API)
      let errMsg = "Terjadi kesalahan. Silakan coba lagi.";
      if (e && typeof e === "object") {
        const err = e as { data?: { message?: string }; message?: string };
        errMsg = err.data?.message || err.message || errMsg;
      }
      await Swal.fire({
        icon: "error",
        title: "Checkout Gagal",
        text: errMsg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /** ——— Render Empty State ——— */
  if (isMounted && cartItems.length === 0) {
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
              Belum ada produk kreatif di keranjang Anda.
            </p>
            <a
              href="/product"
              className="inline-flex bg-[#000000] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Mulai Berbelanja
            </a>

            {/* Recommendation in Empty State */}
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
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-black mt-1 mb-3">
                          {product.name}
                        </h3>
                        <div className="flex gap-2 bg-[#000000] rounded-2xl">
                          <button
                            onClick={() => addRelatedToCart(product.__raw)}
                            className="w-full bg-[#000000] text-white py-3 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Tambah
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

  // --- MAIN CONTENT ---
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-white to-[#DFF19D]/10 pt-24 mt-[-100px] md:mt-0 ${sniglet.className}`}
    >
      <div className="container mx-auto px-6 lg:px-12 pb-12">
        {/* Header */}
        <div className="mb-2">
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
                Keranjang Belanja
              </span>
            </div>
            <h1
              className={`text-4xl lg:text-5xl font-bold text-black mb-4 ${fredoka.className}`}
            >
              Produk <span className="text-[#000000]">Pilihan Anda</span>
            </h1>
          </div>
        </div>

        {/* MAIN LAYOUT GRID (3 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- KOLOM KIRI --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Cart Items Grouped by Product ID */}
            {groupedCartItems.map((group) => {
              const { common, items } = group;
              return (
                <div
                  key={`group-${common.id}`}
                  className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0 self-start">
                      <Image
                        src={getImageUrlFromProduct(common)}
                        alt={common.name}
                        fill
                        className="object-cover rounded-2xl"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="mb-4 border-b border-gray-100 pb-2">
                        <span className="text-sm text-[#000000] font-medium">
                          {common.category_name}
                        </span>
                        <h3 className="text-lg font-bold text-black mt-1">
                          {common.name}
                        </h3>
                      </div>

                      {/* --- List Varian --- */}
                      <div className="space-y-4">
                        {items.map((item) => {
                          const currentStock =
                            typeof item.stock === "number" ? item.stock : 0;
                          const inStock = currentStock > 0;

                          return (
                            <div
                              key={item.cartId}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100"
                            >
                              {/* Info Varian */}
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {item.variant_name && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                                      <Layers className="w-3 h-3 text-gray-500" />
                                      <span>Varian: {item.variant_name}</span>
                                    </div>
                                  )}
                                  {item.size_name && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                                      <Maximize2 className="w-3 h-3 text-gray-500" />
                                      <span>Size: {item.size_name}</span>
                                    </div>
                                  )}
                                  {!item.variant_name && !item.size_name && (
                                    <span className="text-xs text-gray-400 italic">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-base font-bold text-[#000000]">
                                  Rp {(item.price * 1).toLocaleString("id-ID")}
                                </div>
                                {item.weight > 0 && (
                                  <div className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400">
                                    <Scale className="w-3 h-3" />
                                    {item.quantity > 1 ? (
                                      <span>
                                        {formatWeight(item.weight)} × {item.quantity} ={" "}
                                        <span className="font-medium text-gray-500">
                                          {formatWeight(item.weight * item.quantity)}
                                        </span>
                                      </span>
                                    ) : (
                                      <span>{formatWeight(item.weight)}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm">
                                  <button
                                    onClick={() =>
                                      decreaseItemQuantity(item.cartId)
                                    }
                                    disabled={!inStock}
                                    className="p-1.5 hover:bg-gray-100 rounded-l-xl transition-colors disabled:opacity-50 text-gray-600"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    readOnly
                                    className="w-10 px-1 py-1 text-center bg-transparent text-sm focus:outline-none disabled:opacity-50 pointer-events-none text-gray-900 font-medium"
                                  />
                                  <button
                                    onClick={() =>
                                      increaseItemQuantity(item.cartId)
                                    }
                                    disabled={!inStock}
                                    className="p-1.5 hover:bg-gray-100 rounded-r-xl transition-colors disabled:opacity-50 text-gray-600"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="text-right min-w-[80px]">
                                  <div className="font-bold text-black text-sm">
                                    Rp{" "}
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString("id-ID")}
                                  </div>
                                  {!inStock && (
                                    <div className="text-[10px] text-red-500 font-medium">
                                      Stok Habis
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => removeItem(item.cartId)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm hover:shadow-md border border-transparent hover:border-red-100"
                                  title="Hapus varian ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

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
                    ref={nameRef}
                    type="text"
                    value={guest.guest_name}
                    onChange={(e) => {
                      setGuest((s) => ({ ...s, guest_name: e.target.value }));
                      if (fieldErrors.guest_name)
                        setFieldErrors((p) => ({ ...p, guest_name: "" }));
                    }}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent ${
                      fieldErrors.guest_name
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {fieldErrors.guest_name && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.guest_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Nomor Telepon *
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="tel"
                    value={guest.guest_phone}
                    onChange={(e) => {
                      setGuest((s) => ({ ...s, guest_phone: e.target.value }));
                      if (fieldErrors.guest_phone)
                        setFieldErrors((p) => ({ ...p, guest_phone: "" }));
                    }}
                    placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent ${
                      fieldErrors.guest_phone ||
                      (!isPhoneValid && guest.guest_phone)
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {(fieldErrors.guest_phone ||
                    (!isPhoneValid && guest.guest_phone)) && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.guest_phone ||
                        "Format tidak valid. Gunakan: 08xxxxxxxxxx atau +628xxxxxxxxxx"}
                    </p>
                  )}
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Email *
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={guest.guest_email}
                    onChange={(e) => {
                      setGuest((s) => ({ ...s, guest_email: e.target.value }));
                      if (fieldErrors.guest_email)
                        setFieldErrors((p) => ({ ...p, guest_email: "" }));
                    }}
                    placeholder="nama@email.com"
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent ${
                      fieldErrors.guest_email ||
                      (!isEmailValid && guest.guest_email)
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {(fieldErrors.guest_email ||
                    (!isEmailValid && guest.guest_email)) && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.guest_email ||
                        "Format email tidak valid. Contoh: nama@email.com"}
                    </p>
                  )}
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    ref={addressRef}
                    value={guest.address_line_1}
                    onChange={(e) => {
                      setGuest((s) => ({
                        ...s,
                        address_line_1: e.target.value,
                      }));
                      if (fieldErrors.address_line_1)
                        setFieldErrors((p) => ({ ...p, address_line_1: "" }));
                    }}
                    rows={3}
                    placeholder="Nama jalan, RT/RW, Kelurahan"
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent ${
                      fieldErrors.address_line_1
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {fieldErrors.address_line_1 && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.address_line_1}
                    </p>
                  )}
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">
                    Alamat (Baris 2){" "}
                    <span className="text-gray-400">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={guest.address_line_2}
                    onChange={(e) =>
                      setGuest((s) => ({
                        ...s,
                        address_line_2: e.target.value,
                      }))
                    }
                    placeholder="Blok, unit, patokan, dsb (opsional)"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent`}
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
                    ref={postalRef}
                    type="text"
                    inputMode="numeric"
                    value={guest.postal_code}
                    onChange={(e) => {
                      setGuest((s) => ({ ...s, postal_code: e.target.value }));
                      if (fieldErrors.postal_code)
                        setFieldErrors((p) => ({ ...p, postal_code: "" }));
                    }}
                    placeholder="12345"
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent ${
                      fieldErrors.postal_code
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {fieldErrors.postal_code && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.postal_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
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
                    // COD removed — no longer needed
                  }}
                  disabled={!guest.rajaongkir_district_id && !guest.postal_code}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jne">JNE</SelectItem>
                    <SelectItem value="international">Luar Negeri</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {shippingCourier === "jne" && (
                  <>
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
                              ? "border-[#000000] bg-[#000000]/10"
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
                      <p className="text-center text-gray-500">
                        Pilih kecamatan untuk melihat opsi pengiriman.
                      </p>
                    )}
                  </>
                )}

                {(shippingCourier === "cod" ||
                  shippingCourier === "international") && (
                  <>
                    {shippingOptions.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          shippingMethod?.code === option.code
                            ? "border-[#000000] bg-[#000000]/10"
                            : "border-gray-200 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-service"
                          checked={shippingMethod?.code === option.code}
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
                    ))}
                  </>
                )}
              </div>
            </div>

            <PaymentMethodSelector
              paymentType={paymentType}
              onPaymentTypeChange={(t) => {
                setPaymentType(t);
                if (t === "manual") {
                  setPaymentMethod(undefined);
                  setPaymentChannel(undefined);
                }
              }}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              paymentChannel={paymentChannel}
              onPaymentChannelChange={setPaymentChannel}
            />

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <VoucherPicker
                selected={selectedVoucher}
                onChange={setSelectedVoucher}
              />
            </div>

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
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    Total Berat
                  </span>
                  <span className="font-medium text-gray-600">
                    {formatWeight(totalWeight)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Ongkos Kirim</span>
                  <span className="font-semibold">
                    Rp {shippingCost.toLocaleString("id-ID")}
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
                {/* COD removed — only VA, QRIS, E-Wallet */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#000000]">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4 text-[#000000]" />
                  <span>Pembayaran 100% aman</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-[#00000000]" />
                  <span>Garansi 30 hari</span>
                </div>
              </div>

              {fieldErrors.shipping && (
                <p className="text-sm text-red-500 text-center mb-3">
                  {fieldErrors.shipping}
                </p>
              )}
              <button
                onClick={onCheckout}
                disabled={
                  isProcessing ||
                  cartItems.some((it) => !it.stock) ||
                  (paymentType === "automatic" && (!paymentMethod || !paymentChannel))
                }
                className="w-full bg-[#000000] text-white py-4 rounded-2xl font-semibold hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : paymentType === "manual" ? (
                  <>
                    <Upload className="w-5 h-5" />
                    Buat Pesanan
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Checkout Sekarang
                  </>
                )}
              </button>

              {Object.values(fieldErrors).some(Boolean) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  * Harap perbaiki kolom yang ditandai merah di atas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}