"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Heart,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Sparkles,
  Package,
  Shield,
  Truck,
  Star,
  Upload,
  Banknote,
  ExternalLink,
  Layers,
  Maximize2,
} from "lucide-react";
import { Product } from "@/types/admin/product";
import { useGetProductListQuery } from "@/services/product.service";
import DotdLoader from "@/components/loader/3dot";

// === Import logic checkout ===
import { Combobox } from "@/components/ui/combo-box";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useGetProvincesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
} from "@/services/shop/open-shop/open-shop.service";
import {
  useGetCurrentUserQuery,
  useCheckShippingCostQuery,
} from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetUserAddressListQuery } from "@/services/address.service";
import type { Address } from "@/types/address";
import { CheckoutDeps } from "@/types/checkout";
import { useCheckout } from "@/hooks/use-checkout";
import VariantPickerModal from "@/components/variant-picker-modal";
import VoucherPicker from "@/components/voucher-picker";
import type { Voucher } from "@/types/voucher";
import useCart, { CartItem } from "@/hooks/use-cart"; // Import useCart

// Definisi Tipe Pembayaran
type PaymentType = "automatic" | "manual" | "cod";

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
  {
    name: "International",
    code: "intl-taiwan",
    service: "Taiwan",
    description: "Pengiriman internasional ke Taiwan",
    cost: 100000,
    etd: "10-21 hari",
  },
  {
    name: "International",
    code: "intl-hongkong-aan",
    service: "Hong Kong - Aan Express",
    description: "Pengiriman ke Hong Kong via Aan Express",
    cost: 7000,
    etd: "5-10 hari",
  },
  {
    name: "International",
    code: "intl-hongkong-hada",
    service: "Hong Kong - Hada Express",
    description: "Pengiriman ke Hong Kong via Hada Express",
    cost: 7000,
    etd: "5-10 hari",
  },
];

function getImageUrlFromProduct(p: Product): string {
  if (typeof p.image === "string" && p.image) return p.image;
  const media = (p as unknown as { media?: Array<{ original_url: string }> })
    ?.media;
  if (Array.isArray(media) && media[0]?.original_url)
    return media[0].original_url;
  return "/api/placeholder/300/300";
}

const GUEST_INFO_KEY = "__guest_checkout_info__";

type GuestInfo = {
  fullName: string;
  phone: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  postal_code: string;
  rajaongkir_province_id: number;
  rajaongkir_city_id: number;
  rajaongkir_district_id: number;
};

function getGuestInfo(): GuestInfo | null {
  try {
    const raw = localStorage.getItem(GUEST_INFO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestInfo;
    if (!parsed.fullName || !parsed.address_line_1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.email;

  // --- USE CART HOOK ---
  const {
    cartItems,
    removeItem,
    increaseItemQuantity,
    decreaseItemQuantity,
    clearCart,
  } = useCart();

  // --- GROUPING LOGIC ---
  // Mengelompokkan item berdasarkan Product ID agar tampil dalam satu kartu
  // Struktur: { [productId]: { common: ProductInfo, items: [Variant1, Variant2] } }
  const groupedCartItems = useMemo(() => {
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
  }, [cartItems]);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  const openVariantModal = (p: Product) => {
    setVariantProduct(p);
    setVariantModalOpen(true);
  };

  const sessionName = useMemo(() => session?.user?.name ?? "", [session]);

  // Voucher State
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // State Payment Type (Default Automatic)
  const [paymentType, setPaymentType] = useState<PaymentType>("automatic");

  const [shippingCourier, setShippingCourier] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingCostOption | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
    kecamatan: "",
    rajaongkir_province_id: 0,
    rajaongkir_city_id: 0,
    rajaongkir_district_id: 0,
  });

  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [hasDefaultAddress, setHasDefaultAddress] = useState(false);

  const { handleCheckout } = useCheckout();

  const onCheckoutClick = async () => {
    const deps: CheckoutDeps = {
      sessionEmail: session?.user?.email ?? null,
      shippingCourier,
      shippingMethod,
      shippingInfo: {
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        address_line_1: shippingInfo.address_line_1,
        postal_code: shippingInfo.postal_code,
        rajaongkir_province_id: shippingInfo.rajaongkir_province_id,
        rajaongkir_city_id: shippingInfo.rajaongkir_city_id,
        rajaongkir_district_id: shippingInfo.rajaongkir_district_id,
        email: shippingInfo.email,
        address_line_2: shippingInfo.address_line_2,
      },
      paymentType: paymentType,
      paymentMethod: undefined,
      paymentChannel: undefined,
      clearCart,
      voucher: selectedVoucher ? [selectedVoucher.id] : [],
    };

    setIsCheckingOut(true);
    setIsSubmitting(true);
    try {
      await handleCheckout(deps);
    } finally {
      setIsSubmitting(false);
      setIsCheckingOut(false);
    }
  };

  const validatePhone = (phone: string) =>
    /^(?:\+62|62|0)8\d{8,11}$/.test(phone);
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const { data: currentUserResp } = useGetCurrentUserQuery();
  const currentUser = useMemo(() => currentUserResp || null, [currentUserResp]);

  useEffect(() => {
    setIsPhoneValid(validatePhone(shippingInfo.phone));
  }, [shippingInfo.phone]);

  useEffect(() => {
    setIsEmailValid(
      isLoggedIn
        ? true
        : shippingInfo.email
        ? validateEmail(shippingInfo.email)
        : false
    );
  }, [shippingInfo.email, isLoggedIn]);

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const { data: userAddressList } = useGetUserAddressListQuery({
    page: 1,
    paginate: 100,
  });
  const defaultAddress: Address | undefined = userAddressList?.data?.find(
    (a) => a.is_default
  );
  const didPrefill = useRef(false);

  useEffect(() => {
    if (didPrefill.current) return;
    if (sessionName) {
      setShippingInfo((prev) => ({ ...prev, fullName: sessionName }));
    }
  }, [sessionName]);

  useEffect(() => {
    if (didPrefill.current) return;

    if (!isLoggedIn && !hasDefaultAddress) {
      const g = getGuestInfo();
      if (g) {
        setShippingInfo((prev) => ({
          ...prev,
          fullName: g.fullName || prev.fullName,
          phone: g.phone || prev.phone,
          email: g.email || prev.email,
          address_line_1: g.address_line_1 || prev.address_line_1,
          address_line_2: g.address_line_2 || prev.address_line_2,
          postal_code: g.postal_code || prev.postal_code,
          rajaongkir_province_id:
            g.rajaongkir_province_id || prev.rajaongkir_province_id,
          rajaongkir_city_id: g.rajaongkir_city_id || prev.rajaongkir_city_id,
          rajaongkir_district_id:
            g.rajaongkir_district_id || prev.rajaongkir_district_id,
        }));
      }
    }
    didPrefill.current = true;
  }, [isLoggedIn, hasDefaultAddress]);

  const { data: provinces = [], isLoading: loadingProvince } =
    useGetProvincesQuery();
  const { data: cities = [], isLoading: loadingCity } = useGetCitiesQuery(
    shippingInfo.rajaongkir_province_id,
    { skip: !shippingInfo.rajaongkir_province_id }
  );
  const { data: districts = [], isLoading: loadingDistrict } =
    useGetDistrictsQuery(shippingInfo.rajaongkir_city_id, {
      skip: !shippingInfo.rajaongkir_city_id,
    });

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
      destination: String(shippingInfo.rajaongkir_district_id),
      weight: 1000,
      height: 10,
      length: 10,
      width: 10,
      diameter: 10,
      courier: shippingCourier ?? "",
    },
    {
      skip:
        !shippingInfo.rajaongkir_district_id ||
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

  const {
    data: relatedResp,
    isLoading: isRelLoading,
    isError: isRelError,
  } = useGetProductListQuery({
    page: 1,
    paginate: 6,
    product_merk_id: undefined,
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

  const subtotal = cartItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  const discount = useMemo(() => {
    if (!selectedVoucher) return 0;
    if (selectedVoucher.type === "fixed") {
      return Math.min(selectedVoucher.fixed_amount, subtotal);
    }
    if (selectedVoucher.type === "percentage") {
      const amount = (subtotal * selectedVoucher.percentage_amount) / 100;
      return Math.round(amount);
    }
    return 0;
  }, [selectedVoucher, subtotal]);

  const shippingCost = shippingMethod?.cost ?? 0;

  const codFee =
    paymentType === "cod"
      ? Math.round((subtotal - discount + shippingCost) * 0.02)
      : 0;

  const total = Math.max(0, subtotal - discount + shippingCost + codFee);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white to-[#6B6B6B]/10 pt-12 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* --- EMPTY STATE SECTION --- */}
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-32 h-32 bg-[#6B6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="w-16 h-16 text-[#6B6B6B]" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Keranjang Kosong
            </h1>

            <p className="text-xl text-gray-600 mb-8 px-4">
              Belum ada produk kreatif di keranjang Anda. Yuk, jelajahi koleksi
              produk ramah lingkungan kami!
            </p>

            <a
              href="/product"
              className="inline-flex bg-[#6B6B6B] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Mulai Berbelanja
            </a>
          </div>

          {/* --- RECOMMENDATION SECTION (tetap sama) --- */}
          {/* ... (Code rekomendasi di sini tetap sama, tidak berubah) ... */}
        </div>
      </div>
    );
  }

  // --- MAIN CONTENT ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#DFF19D]/10 pt-12">
      <div className="container mx-auto px-6 lg:px-12 pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <a
              href="/product"
              className="flex items-center gap-2 text-gray-600 hover:text-[#6B6B6B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Lanjut Belanja
            </a>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#6B6B6B]/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#6B6B6B]" />
              <span className="text-sm font-medium text-[#6B6B6B]">
                Keranjang Belanja
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Produk <span className="text-[#6B6B6B]">Pilihan Anda</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Review produk favorit dan lanjutkan untuk mendapatkan pengalaman
              berkreasi terbaik untuk si kecil
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* LOOPING GROUPED ITEMS 
              Kita looping berdasarkan Product ID (group) agar tampilan rapi,
              lalu di dalam card produk tersebut kita looping variants/items yang dipilih.
            */}
            {groupedCartItems.map((group) => {
              const { common, items } = group;
              return (
                <div
                  key={`group-${common.id}`}
                  className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Gambar Produk (Hanya Muncul Sekali per Produk Group) */}
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
                        <span className="text-sm text-[#6B6B6B] font-medium">
                          {common.category_name}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">
                          {common.name}
                        </h3>
                      </div>

                      {/* LIST VARIANT / ITEM YANG DIPILIH 
                        Di sini kita render baris per cartId (varian/size unik)
                      */}
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
                              {/* Kiri: Info Varian & Harga */}
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {item.variant_name && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                                      <Layers className="w-3 h-3 text-gray-500" />
                                      <span>{item.variant_name}</span>
                                    </div>
                                  )}
                                  {item.size_name && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                                      <Maximize2 className="w-3 h-3 text-gray-500" />
                                      <span>{item.size_name}</span>
                                    </div>
                                  )}
                                  {/* Jika tidak ada varian/size, tampilkan default atau kosongkan */}
                                  {!item.variant_name && !item.size_name && (
                                    <span className="text-xs text-gray-400 italic">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-base font-bold text-[#6B6B6B]">
                                  Rp {(item.price * 1).toLocaleString("id-ID")}
                                </div>
                              </div>

                              {/* Kanan: Controls (Qty & Delete) */}
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
                                  <div className="font-bold text-gray-900 text-sm">
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

            {/* --- SHIPPING INFO SECTION --- */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#6B6B6B]" />
                Informasi Pengiriman
              </h3>

              {hasDefaultAddress && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Alamat sudah terisi otomatis dari data default Anda.
                      <span className="font-medium">
                        {" "}
                        Data ini tidak dapat diubah.
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    placeholder="Masukkan nama lengkap"
                    disabled={hasDefaultAddress}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                      hasDefaultAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon *
                  </label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    disabled={hasDefaultAddress}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                      hasDefaultAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                {!isLoggedIn && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span>*</span>
                    </label>
                    <input
                      type="email"
                      value={shippingInfo.email ?? ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="nama@email.com"
                      disabled={hasDefaultAddress}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                        hasDefaultAddress
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                    />
                  </div>
                )}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    value={shippingInfo.address_line_1}
                    onChange={(e) =>
                      handleInputChange("address_line_1", e.target.value)
                    }
                    rows={3}
                    placeholder="Nama jalan, RT/RW, Kelurahan"
                    disabled={hasDefaultAddress}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                      hasDefaultAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat (Baris 2){" "}
                    <span className="text-gray-400">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.address_line_2}
                    onChange={(e) =>
                      handleInputChange("address_line_2", e.target.value)
                    }
                    placeholder="Blok, unit, patokan, dsb (opsional)"
                    disabled={hasDefaultAddress}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                      hasDefaultAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                {shippingCourier === "jne" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provinsi
                      </label>
                      <Combobox
                        value={shippingInfo.rajaongkir_province_id}
                        onChange={(id) => {
                          setShippingInfo((prev) => ({
                            ...prev,
                            rajaongkir_province_id: id,
                            rajaongkir_city_id: 0,
                            rajaongkir_district_id: 0,
                          }));
                          setShippingMethod(null);
                        }}
                        data={provinces}
                        isLoading={loadingProvince}
                        getOptionLabel={(item) => item.name}
                        disabled={hasDefaultAddress}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kota / Kabupaten
                      </label>
                      <Combobox
                        value={shippingInfo.rajaongkir_city_id}
                        onChange={(id) => {
                          setShippingInfo((prev) => ({
                            ...prev,
                            rajaongkir_city_id: id,
                            rajaongkir_district_id: 0,
                          }));
                          setShippingMethod(null);
                        }}
                        data={cities}
                        isLoading={loadingCity}
                        getOptionLabel={(item) => item.name}
                        disabled={
                          hasDefaultAddress ||
                          !shippingInfo.rajaongkir_province_id
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kecamatan
                      </label>
                      <Combobox
                        value={shippingInfo.rajaongkir_district_id}
                        onChange={(id) => {
                          setShippingInfo((prev) => ({
                            ...prev,
                            rajaongkir_district_id: id,
                          }));
                          setShippingMethod(null);
                        }}
                        data={districts}
                        isLoading={loadingDistrict}
                        getOptionLabel={(item) => item.name}
                        disabled={
                          hasDefaultAddress || !shippingInfo.rajaongkir_city_id
                        }
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.postal_code}
                    onChange={(e) =>
                      handleInputChange("postal_code", e.target.value)
                    }
                    placeholder="16911"
                    disabled={hasDefaultAddress}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                      hasDefaultAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">
                Metode Pengiriman
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Kurir
                </label>
                <Select
                  value={shippingCourier ?? ""}
                  onValueChange={(val) => {
                    setShippingCourier(val);
                    setShippingMethod(null);
                    if (val === "international" && paymentType === "cod") {
                      setPaymentType("automatic");
                    }
                  }}
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
                              ? "border-[#6B6B6B] bg-[#DFF19D]/30"
                              : "border-gray-200 hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping-service"
                            checked={shippingMethod?.service === option.service}
                            onChange={() => setShippingMethod(option)}
                            className="form-radio text-[#6B6B6B] h-4 w-4"
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
                            ? "border-[#6B6B6B] bg-[#DFF19D]/30"
                            : "border-gray-200 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-service"
                          checked={shippingMethod?.code === option.code}
                          onChange={() => setShippingMethod(option)}
                          className="form-radio text-[#6B6B6B] h-4 w-4"
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

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#6B6B6B]" />
                Metode Pembayaran
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Pembayaran
                  </label>
                  <div className="space-y-2">
                    <div
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentType === "automatic"
                          ? "border-black bg-neutral-50"
                          : "border-neutral-200 hover:bg-neutral-50"
                      }`}
                      onClick={() => setPaymentType("automatic")}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          paymentType === "automatic"
                            ? "border-black"
                            : "border-neutral-400"
                        }`}
                      >
                        {paymentType === "automatic" && (
                          <div className="h-2 w-2 rounded-full bg-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Otomatis</p>
                        <p className="text-sm text-gray-500">
                          Pembayaran online (Gateway)
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentType === "manual"
                          ? "border-black bg-neutral-50"
                          : "border-neutral-200 hover:bg-neutral-50"
                      }`}
                      onClick={() => setPaymentType("manual")}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          paymentType === "manual"
                            ? "border-black"
                            : "border-neutral-400"
                        }`}
                      >
                        {paymentType === "manual" && (
                          <div className="h-2 w-2 rounded-full bg-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Manual</p>
                        <p className="text-sm text-gray-500">
                          Transfer Manual (Konfirmasi Admin)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentType === "automatic" && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <div className="mt-0.5">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Pembayaran via Doku</p>
                      <p>
                        Anda akan diarahkan ke halaman pembayaran aman setelah
                        menekan tombol Checkout. Tersedia berbagai metode (QRIS,
                        VA, E-Wallet).
                      </p>
                    </div>
                  </div>
                )}

                {paymentType === "manual" && (
                  <div className="p-3 bg-neutral-100 rounded-lg border border-neutral-200">
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Banknote className="w-4 h-4" />
                      <span>
                        Silakan selesaikan pesanan, admin akan menghubungi Anda.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <VoucherPicker
                selected={selectedVoucher}
                onChange={setSelectedVoucher}
              />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">
                Ringkasan Pesanan
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({cartItems.length} produk)
                  </span>
                  <span className="font-semibold">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Voucher</span>
                    <span>- Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkos Kirim</span>
                  <span className="font-semibold">
                    Rp {shippingCost.toLocaleString("id-ID")}
                  </span>
                </div>
                {paymentType === "cod" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee COD (2%)</span>
                    <span className="font-semibold">
                      Rp {codFee.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#6B6B6B]">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onCheckoutClick}
                disabled={
                  isCheckingOut ||
                  isSubmitting ||
                  cartItems.some((it) => {
                    const stock = typeof it.stock === "number" ? it.stock : 0;
                    return stock <= 0;
                  }) ||
                  !shippingMethod ||
                  !shippingInfo.fullName ||
                  !shippingInfo.address_line_1 ||
                  !shippingInfo.postal_code ||
                  !isPhoneValid ||
                  !paymentType ||
                  (!isLoggedIn && !isEmailValid)
                }
                className="w-full bg-[#6B6B6B] text-white py-4 rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut || isSubmitting ? (
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
              {(!paymentType ||
                !shippingMethod ||
                !shippingInfo.fullName ||
                !shippingInfo.address_line_1) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  * Harap lengkapi semua informasi yang diperlukan
                </p>
              )}
              {cartItems.some((it) => {
                const stock = typeof it.stock === "number" ? it.stock : 0;
                return stock <= 0;
              }) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  Beberapa produk tidak tersedia. Hapus untuk melanjutkan.
                </p>
              )}
            </div>
          </div>
        </div>
        <VariantPickerModal
          open={variantModalOpen}
          product={variantProduct}
          onClose={() => setVariantModalOpen(false)}
          onAdded={() => {
            // Cart auto updates via hook
          }}
        />
      </div>
    </div>
  );
}