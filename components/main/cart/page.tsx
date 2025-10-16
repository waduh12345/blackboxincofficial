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
  Tag,
  X,
  CheckCircle,
  Sparkles,
  Package,
  Shield,
  Truck,
  Star,
  Upload,
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
import { useCreateTransactionMutation } from "@/services/admin/transaction.service";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";
import { useGetUserAddressListQuery } from "@/services/address.service";
import type { Address } from "@/types/address";
import {
  CreateTransactionRequest,
  PaymentType,
} from "@/types/admin/transaction";
import { ProductVariant } from "@/types/admin/product-variant";
import VariantPicker from "@/components/ui/variant-picker";
import PaymentPanel, {
  PaymentResp as GatewayPayment,
} from "./payment-panel";
import PaymentModal from "./payment-modal";

const STORAGE_KEY = "cart-storage";

export type StoredCartItem = Product & {
  quantity: number;
  selected_variant_id?: number | null;
  variant_price?: number | null;
  slug?: string;
  product_slug?: string;
};

type AutomaticMethod = "bank_transfer" | "qris";
type BankChannel =
  | "bnc"
  | "bjb"
  | "bca"
  | "bni"
  | "bsi"
  | "bss"
  | "cimb"
  | "qris";

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

// Custom shipping options for COD and International
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

interface ProductMediaLike {
  media?: Array<{ original_url?: string }>;
}

function getImageUrlFromProduct(p: Product): string {
  if (typeof p.image === "string" && p.image) return p.image;
  const media = (p as ProductMediaLike).media;
  if (Array.isArray(media) && media[0]?.original_url)
    return media[0].original_url!;
  return "/api/placeholder/300/300";
}

const getProductSlug = (p: {
  slug?: string;
  product_slug?: string;
}): string | null => p.slug ?? p.product_slug ?? null;

interface CartItemView {
  id: number;
  name: string;
  price: number; // ← harga efektif (varian > produk)
  originalPrice?: number;
  image: string;
  quantity: number;
  category: string;
  ageGroup: string;
  isEcoFriendly: boolean;
  inStock: boolean;
  // new:
  slug: string | null;
  selectedVariantId: number | null;
}

function mapStoredToView(items: StoredCartItem[]): CartItemView[] {
  return items.map((it) => ({
    id: it.id,
    name: it.name,
    // gunakan variant_price jika ada
    price: typeof it.variant_price === "number" ? it.variant_price : it.price,
    originalPrice: undefined,
    image: getImageUrlFromProduct(it),
    quantity: it.quantity ?? 1,
    category: it.category_name,
    ageGroup: "Semua usia",
    isEcoFriendly: false,
    inStock: (it.stock ?? 0) > 0,
    // new:
    slug: getProductSlug(it),
    selectedVariantId: it.selected_variant_id ?? null,
  }));
}

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const sessionName = useMemo(() => session?.user?.name ?? "", [session]);

  const [cartItems, setCartItems] = useState<CartItemView[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const [paymentType, setPaymentType] = useState<PaymentType>("manual");
  const [paymentInfo, setPaymentInfo] = useState<GatewayPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [shippingCourier, setShippingCourier] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingCostOption | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address_line_1: "",
    city: "",
    postal_code: "",
    kecamatan: "",
    rajaongkir_province_id: 0,
    rajaongkir_city_id: 0,
    rajaongkir_district_id: 0,
  });

  const [autoMethod, setAutoMethod] = useState<AutomaticMethod | "">("");
  const [autoChannel, setAutoChannel] = useState<BankChannel | "">("");

  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [hasDefaultAddress, setHasDefaultAddress] = useState(false);
  const validatePhone = (phone: string) => {
    const regex = /^(?:\+62|62|0)8\d{8,11}$/;
    return regex.test(phone);
  };
  const { data: currentUserResp } = useGetCurrentUserQuery();
  const currentUser = useMemo(() => currentUserResp || null, [currentUserResp]);
  useEffect(() => {
    console.log(currentUser);
    // if(session == null){
    //     router.push("/login"); // tujuan setelah login
    //     return;
    // }
    setIsPhoneValid(validatePhone(shippingInfo.phone));
  }, [shippingInfo.phone]);

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

    // Check if user has default address from /me API
    if (currentUser?.default_address) {
      const defaultAddr = currentUser.default_address;
      setShippingInfo((prev) => ({
        ...prev,
        phone: currentUser?.phone || "",
        address_line_1: defaultAddr.address_line_1 ?? prev.address_line_1,
        postal_code: defaultAddr.postal_code ?? prev.postal_code,
        rajaongkir_province_id:
          defaultAddr.rajaongkir_province_id ?? prev.rajaongkir_province_id,
        rajaongkir_city_id:
          defaultAddr.rajaongkir_city_id ?? prev.rajaongkir_city_id,
        rajaongkir_district_id:
          defaultAddr.rajaongkir_district_id ?? prev.rajaongkir_district_id,
      }));
      setHasDefaultAddress(true); // Disable form fields
      didPrefill.current = true;
    }
    // Fallback to old address list if no default_address from /me API
    else if (defaultAddress) {
      setShippingInfo((prev) => ({
        ...prev,
        phone: currentUser?.phone || "",
        address_line_1: defaultAddress.address_line_1 ?? prev.address_line_1,
        postal_code: defaultAddress.postal_code ?? prev.postal_code,
        rajaongkir_province_id:
          defaultAddress.rajaongkir_province_id ?? prev.rajaongkir_province_id,
        rajaongkir_city_id:
          defaultAddress.rajaongkir_city_id ?? prev.rajaongkir_city_id,
        rajaongkir_district_id:
          defaultAddress.rajaongkir_district_id ?? prev.rajaongkir_district_id,
      }));
      setHasDefaultAddress(true); // Disable form fields
      didPrefill.current = true;
    }
  }, [defaultAddress, currentUser]);

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

  const [createTransaction] = useCreateTransactionMutation();

  // Custom logic for shipping options
  const getShippingOptions = (): ShippingCostOption[] => {
    if (shippingCourier === "cod") {
      return COD_SHIPPING_OPTIONS;
    } else if (shippingCourier === "international") {
      return INTERNATIONAL_SHIPPING_OPTIONS;
    }
    return apiShippingOptions;
  };

  // Original RTK Query for JNE
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

  // Reset shipping method when options change
  useEffect(() => {
    if (shippingOptions.length > 0) {
      setShippingMethod(shippingOptions[0]);
    } else {
      setShippingMethod(null);
    }
  }, [shippingOptions]);

  // Initial load + listen to changes
  useEffect(() => {
    const sync = () => setCartItems(mapStoredToView(parseStorage()));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("cartUpdated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cartUpdated", sync);
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

  const onPickVariant = (itemId: number, v: ProductVariant) => {
    updateStorageAndState((items) =>
      items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              selected_variant_id: v.id,
              variant_price: v.price, // harga efektif jadi harga varian
            }
          : it
      )
    );
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

  const applyCoupon = () => {
    if (couponCode.trim().toLowerCase() === "BLACKBOXINC10") {
      setAppliedCoupon("BLACKBOXINC10");
      setCouponCode("");
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const {
    data: relatedResp,
    isLoading: isRelLoading,
    isError: isRelError,
  } = useGetProductListQuery({
    page: 1,
    paginate: 6,
    product_merk_id: null,
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
  };

  const subtotal = cartItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const discount =
    appliedCoupon === "BLACKBOXINC10" ? Math.round(subtotal * 0.1) : 0;

  const shippingCost = shippingMethod?.cost ?? 0;

  // Calculate COD fee (2% of subtotal when COD is selected)
  const codFee =
    paymentType === "cod"
      ? Math.round((subtotal - discount + shippingCost) * 0.02)
      : 0;

  const total = subtotal - discount + shippingCost + codFee;

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    if (
      !shippingMethod ||
      !shippingInfo.fullName ||
      !shippingInfo.address_line_1 ||
      !shippingInfo.postal_code ||
      !isPhoneValid
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Lengkapi Data",
        text: "Harap lengkapi semua informasi yang diperlukan untuk melanjutkan.",
      });
      setIsCheckingOut(false);
      return;
    }

    // ===== Helper varian (tanpa any) =====
    type VariantObj = { id: number };
    type VariantCapable = StoredCartItem & {
      selected_variant_id?: number | null;
      product_variant_id?: number | null;
      variant_id?: number | null;
      variant?: VariantObj | null;
      variants?: VariantObj[] | null;
      product_variants?: VariantObj[] | null;
    };
    const deriveVariantId = (item: VariantCapable): number | null => {
      if (typeof item.selected_variant_id === "number")
        return item.selected_variant_id;
      if (typeof item.product_variant_id === "number")
        return item.product_variant_id;
      if (typeof item.variant_id === "number") return item.variant_id;
      if (item.variant?.id) return item.variant.id;
      const list = item.variants ?? item.product_variants ?? [];
      return Array.isArray(list) && list[0]?.id ? list[0].id : null;
    };

    setIsSubmitting(true);
    try {
      const stored = parseStorage();

      const missingVariant = stored
        .map((it) => ({ it, v: deriveVariantId(it as VariantCapable) }))
        .filter(({ v }) => v == null)
        .map(({ it }) => it.name ?? `#${it.id}`);

      if (missingVariant.length > 0) {
        await Swal.fire({
          icon: "warning",
          title: "Varian belum dipilih",
          html:
            `<p class="text-left">Produk berikut belum punya varian:</p>` +
            `<ul class="text-left mt-2">${missingVariant
              .map((n) => `<li>• ${n}</li>`)
              .join("")}</ul>` +
            `<p class="text-left mt-3">Silakan pilih varian di halaman produk/keranjang terlebih dulu.</p>`,
        });
        setIsSubmitting(false);
        setIsCheckingOut(false);
        return;
      }

      const details = stored.map((item) => ({
        product_id: item.id,
        product_variant_id: deriveVariantId(item as VariantCapable)!,
        quantity: item.quantity ?? 1,
      }));

      const payment_type: "automatic" | "manual" | "cod" =
        paymentType === "midtrans" ? "automatic" : paymentType;

      const payload: CreateTransactionRequest = {
        address_line_1: shippingInfo.address_line_1,
        postal_code: shippingInfo.postal_code,
        payment_type,
        ...(payment_type === "automatic"
          ? {
              payment_method: autoMethod as "bank_transfer" | "qris",
              payment_channel: autoChannel as
                | "bnc"
                | "bjb"
                | "bca"
                | "bni"
                | "bsi"
                | "bss"
                | "cimb"
                | "qris",
            }
          : {}),
        data: [
          {
            shop_id: 1,
            details,
            shipment: {
              parameter: JSON.stringify({
                destination: String(shippingInfo.rajaongkir_district_id),
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
            customer_info: {
              name: shippingInfo.fullName,
              phone: shippingInfo.phone,
              address_line_1: shippingInfo.address_line_1,
              postal_code: shippingInfo.postal_code,
              province_id: shippingInfo.rajaongkir_province_id,
              city_id: shippingInfo.rajaongkir_city_id,
              district_id: shippingInfo.rajaongkir_district_id,
            },
          },
        ],
      };

      // ===== Tipe & type guard respons gateway =====
      type PaymentTypeResp = "qris" | "bank_transfer";
      interface PaymentResp {
        id: number;
        driver: string;
        payable_type: string;
        payable_id: number;
        order_id: string;
        transaction_id: string;
        payment_type: PaymentTypeResp;
        account_number: string; // QR string atau nomor VA
        account_code: string | null; // contoh: BCA_VIRTUAL_ACCOUNT
        channel: string; // contoh: "bca" / "qris"
        expired_at: string;
        paid_at: string | null;
        amount: number;
        created_at: string;
        updated_at: string;
      }
      interface UserResp {
        id: number;
        name: string;
        phone: string;
        email: string;
        email_verified_at: string | null;
        created_at: string;
        updated_at: string;
      }
      interface TransactionResp {
        id: number;
        reference: string;
        ref_number: number;
        address_line_1: string;
        address_line_2?: string | null;
        postal_code: string;
        total: number;
        discount_total: number;
        shipment_cost: number;
        grand_total: number;
        guest_name: string | null;
        guest_email: string | null;
        guest_phone: string | null;
        type: string;
        created_at: string;
        updated_at: string;
        user: UserResp;
        payment?: PaymentResp;
      }
      // ganti nama supaya tidak konflik dengan tipe import
      interface GatewayCreateTransactionResponse {
        code?: number;
        message?: string;
        data: TransactionResp;
      }

      const isObject = (x: unknown): x is Record<string, unknown> =>
        typeof x === "object" && x !== null;

      const isPaymentResp = (x: unknown): x is GatewayPayment => {
        if (typeof x !== "object" || x === null) return false;
        const o = x as Record<string, unknown>;
        return (
          typeof o["payment_type"] === "string" &&
          typeof o["channel"] === "string" &&
          typeof o["account_number"] === "string" &&
          typeof o["amount"] === "number" &&
          typeof o["expired_at"] === "string"
        );
      };

      const isGatewayCreateTransactionResponse = (
        x: unknown
      ): x is GatewayCreateTransactionResponse => {
        if (!isObject(x)) return false;
        const data = (x as Record<string, unknown>)["data"];
        if (!isObject(data)) return false;
        const hasReference = typeof data["reference"] === "string";
        const pay = data["payment"];
        const payOk = pay === undefined || isPaymentResp(pay);
        return hasReference && payOk;
      };

      // ==== Panggil API
      const raw = await createTransaction(payload).unwrap();

      if (!isGatewayCreateTransactionResponse(raw)) {
        // fallback lama (mis. skema yang mengembalikan payment_link)
        await Swal.fire({
          icon: "info",
          title: "Pesanan Dibuat",
          text: "Pesanan berhasil dibuat, namun format respons pembayaran tidak dikenali. Silakan cek halaman pesanan.",
        });
        clearCart();
        router.push("/me");
        return;
      }

      const trx = raw.data;
      const pay = trx.payment;
      const isAutomatic = payment_type === "automatic";

     if (isAutomatic) {
       if (pay) {
         setPaymentInfo(pay);
         setShowPaymentModal(true);
         // opsional: JANGAN clearCart dulu supaya user masih bisa lihat itemnya
         // clearCart(); // kalau mau kosongkan keranjang di awal, aktifkan ini
       } else {
         await Swal.fire({
           icon: "info",
           title: "Pesanan Dibuat",
           text: "Pesanan berhasil dibuat, namun informasi pembayaran belum tersedia. Silakan cek halaman pesanan Anda.",
         });
         clearCart();
         router.push("/me");
       }
     } else {
       await Swal.fire({
         icon: "success",
         title: "Pesanan Berhasil Dibuat",
         text: "Instruksi pembayaran tersedia di halaman pesanan.",
       });
       clearCart();
       router.push("/me");
     }
    } catch (err: unknown) {
      console.error("Error creating transaction:", err);

      let serverMessage =
        "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.";
      let fieldErrors = "";

      const apiErr = err as {
        data?: { message?: string; errors?: Record<string, string[] | string> };
      };
      const genericErr = err as { message?: string };

      if (apiErr?.data?.message) serverMessage = apiErr.data.message;
      else if (genericErr?.message) serverMessage = genericErr.message;

      const rawErrors: Record<string, string[] | string> | undefined =
        apiErr?.data?.errors;
      if (rawErrors) {
        fieldErrors = Object.entries(rawErrors)
          .map(([field, msgs]) => {
            const list = Array.isArray(msgs) ? msgs : [msgs];
            return `${field}: ${list.join(", ")}`;
          })
          .join("\n");
      }

      await Swal.fire({
        icon: "error",
        title: "Gagal Membuat Pesanan",
        html:
          `<p style="text-align:left">${serverMessage}</p>` +
          (fieldErrors
            ? `<pre style="text-align:left;white-space:pre-wrap;background:#f8f9fa;padding:12px;border-radius:8px;margin-top:8px">${fieldErrors}</pre>`
            : ""),
      });
    } finally {
      setIsSubmitting(false);
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white to-[#6B6B6B]/10 pt-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-32 h-32 bg-[#6B6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="w-16 h-16 text-[#6B6B6B]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Keranjang Kosong
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Belum ada produk kreatif di keranjang Anda. Yuk, jelajahi koleksi
              produk ramah lingkungan kami!
            </p>
            <a
              href="/product"
              className="inline-flex bg-[#6B6B6B] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Mulai Berbelanja
            </a>
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Produk Rekomendasi
              </h2>
              {isRelLoading && (
                <div className="text-gray-600 w-full flex items-center justify-center min-h-96">
                  <DotdLoader />
                </div>
              )}
              {isRelError && (
                <div className="text-red-600">Gagal memuat rekomendasi.</div>
              )}
              {!isRelLoading && !isRelError && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-80">
                  {relatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="min-w-80 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                    >
                      <div className="relative h-48">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                        </button>
                      </div>
                      <div className="p-6">
                        <span className="text-sm text-[#6B6B6B] font-medium">
                          {product.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1 mb-3">
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
                          <span className="text-sm text-gray-600">
                            ({product.rating.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xl font-bold text-[#6B6B6B]">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              Rp {product.originalPrice.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 bg-[#6B6B6B] rounded-2xl">
                          <button
                            onClick={() => addRelatedToCart(product.__raw)}
                            className="w-full bg-[#6B6B6B] text-white py-3 rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-gradient-to-br from-white to-[#DFF19D]/10 pt-24">
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
                        <span className="text-sm text-[#6B6B6B] font-medium">
                          {item.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Untuk anak {item.ageGroup}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Tambah ke Wishlist"
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Hapus dari Keranjang"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#6B6B6B]">
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
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value, 10);
                              if (!isNaN(newQty)) {
                                updateQuantity(item.id, newQty);
                              }
                            }}
                            onBlur={(e) => {
                              // Ensure quantity is at least 1 when user clicks away
                              const newQty = parseInt(e.target.value, 10);
                              if (isNaN(newQty) || newQty < 1) {
                                updateQuantity(item.id, 1);
                              }
                            }}
                            min="1"
                            disabled={!item.inStock}
                            className="w-16 px-2 py-2 text-center bg-transparent focus:outline-none disabled:opacity-50"
                          />
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
                          <div className="font-bold text-gray-900">
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
                    <VariantPicker
                      itemId={item.id}
                      productSlug={item.slug}
                      selectedVariantId={item.selectedVariantId}
                      onPick={(v) => onPickVariant(item.id, v)}
                    />
                  </div>
                </div>
              </div>
            ))}

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
                  {!isPhoneValid && shippingInfo.phone && (
                    <p className="text-sm text-red-500 mt-0.5">
                      Nomor telepon tidak valid
                    </p>
                  )}
                </div>

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

                    // ✅ Jika kurir Luar Negeri, paksa non-COD
                    if (val === "international" && paymentType === "cod") {
                      setPaymentType("midtrans");
                    }
                  }}
                >
                  <SelectTrigger>
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
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="payment-type"
                        value="midtrans"
                        checked={paymentType === "midtrans"}
                        onChange={(e) => {
                          const v = e.currentTarget.value as PaymentType;
                          setPaymentType(v);
                          // reset pilihan gateway agar tidak ikut terbawa
                          setAutoMethod("");
                          setAutoChannel("");
                        }}
                        className="form-radio text-[#6B6B6B] h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">Otomatis</p>
                        <p className="text-sm text-gray-500">
                          Pembayaran online (Gateway)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="payment-type"
                        value="manual"
                        checked={paymentType === "manual"}
                        onChange={(e) =>
                          setPaymentType(e.currentTarget.value as PaymentType)
                        }
                        className="form-radio text-[#6B6B6B] h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">Manual</p>
                        <p className="text-sm text-gray-500">
                          Transfer bank manual
                        </p>
                      </div>
                    </label>

                    {shippingCourier !== "international" && (
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="payment-type"
                          value="cod"
                          checked={paymentType === "cod"}
                          onChange={(e) =>
                            setPaymentType(e.currentTarget.value as PaymentType)
                          }
                          className="form-radio text-[#6B6B6B] h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">COD</p>
                          <p className="text-sm text-gray-500">
                            +Fee 2% terhadap nilai pesanan
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {paymentType === "manual" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Rekening Tujuan Transfer
                          </h4>

                          <div className="bg-white p-3 rounded-lg mb-3">
                            <p className="font-semibold text-gray-900">
                              ISMAIL MARZUKI
                            </p>
                            <p className="text-sm text-gray-600">
                              Bank Mandiri
                            </p>
                            <p className="font-mono text-lg font-bold text-gray-900">
                              1340010955069
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">
                              Herlina Hartosuharto
                            </p>
                            <p className="text-sm text-gray-600">Bank BCA</p>
                            <p className="font-mono text-lg font-bold text-gray-900">
                              3030727834
                            </p>
                          </div>

                          <p className="text-sm text-blue-700 mt-3">
                            Setelah transfer, Anda dapat mengupload bukti
                            pembayaran melalui halaman profil pesanan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentType === "midtrans" && (
                  <div className="space-y-3 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Pembayaran Online
                    </label>

                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="auto-method"
                          value="qris"
                          checked={autoMethod === "qris"}
                          onChange={() => {
                            setAutoMethod("qris");
                            setAutoChannel("qris"); // channel wajib 'qris' untuk QRIS
                          }}
                          className="form-radio text-[#6B6B6B] h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">QRIS</p>
                          <p className="text-sm text-gray-500">
                            Scan QR (semua e-wallet/bank)
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="auto-method"
                          value="bank_transfer"
                          checked={autoMethod === "bank_transfer"}
                          onChange={() => {
                            setAutoMethod("bank_transfer");
                            setAutoChannel(""); // pilih bank di bawah
                          }}
                          className="form-radio text-[#6B6B6B] h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">Virtual Account</p>
                          <p className="text-sm text-gray-500">
                            VA bank (BCA/BNI/BSI/BJB/BNC/BSS/CIMB)
                          </p>
                        </div>
                      </label>
                    </div>

                    {autoMethod === "bank_transfer" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih Bank
                        </label>
                        <Select
                          value={autoChannel}
                          onValueChange={(val) =>
                            setAutoChannel(val as BankChannel)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bca">BCA</SelectItem>
                            <SelectItem value="bni">BNI</SelectItem>
                            <SelectItem value="bsi">BSI</SelectItem>
                            <SelectItem value="bjb">BJB</SelectItem>
                            <SelectItem value="bnc">BNC</SelectItem>
                            <SelectItem value="bss">BSS</SelectItem>
                            <SelectItem value="cimb">CIMB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg hidden">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#6B6B6B]" />
                Kode Promo
              </h3>
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {appliedCoupon}
                    </span>
                    <span className="text-sm text-green-600">- 10% Diskon</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Masukkan kode promo"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-6 py-3 bg-[#6B6B6B] text-white rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors"
                  >
                    Pakai
                  </button>
                </div>
              )}
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  💡 Coba kode: <strong>BLACKBOXINC10</strong> untuk diskon 10%
                </p>
              </div>
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
                    <span>Diskon Promo</span>
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
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Pembayaran 100% aman</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Gratis ongkir untuk belanja di atas 250k</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Garansi 30 hari</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={
                  isCheckingOut ||
                  isSubmitting ||
                  cartItems.some((it) => !it.inStock) ||
                  !shippingMethod ||
                  !shippingInfo.fullName ||
                  !shippingInfo.address_line_1 ||
                  !shippingInfo.postal_code ||
                  !isPhoneValid ||
                  !paymentType ||
                  (paymentType === "midtrans" && (!autoMethod || !autoChannel)) // qris akan otomatis set 'qris'
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
              {cartItems.some((it) => !it.inStock) && (
                <p className="text-red-500 text-sm text-center mt-3">
                  Beberapa produk tidak tersedia. Hapus untuk melanjutkan.
                </p>
              )}
            </div>
          </div>
        </div>
        {/* <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produk <span className="text-[#6B6B6B]">Rekomendasi</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Lengkapi koleksi kreatif si kecil dengan produk pilihan lainnya
            </p>
          </div>
          {isRelLoading && (
            <div className="text-center text-gray-600">
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
                      <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                    </button>
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-[#6B6B6B] font-medium">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1 mb-3">
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
                      <span className="text-sm text-gray-600">
                        ({product.rating.toFixed(1)})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl font-bold text-[#6B6B6B]">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          Rp {product.originalPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 bg-[#6B6B6B] rounded-2xl">
                      <button
                        onClick={() => addRelatedToCart(product.__raw)}
                        className="w-full bg-black/50 text-white py-3 rounded-2xl font-semibold hover:bg-[#6B6B6B]/90 transition-colors flex items-center justify-center gap-2"
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
        </div> */}
      </div>
      <PaymentModal
        open={showPaymentModal}
        payment={paymentInfo}
        onClose={() => {
          // aksi saat modal ditutup:
          clearCart();
          setShowPaymentModal(false);
          router.push("/me"); // menuju halaman pesanan
        }}
        onCopied={(msg) =>
          Swal.fire({
            icon: "success",
            title: msg,
            timer: 900,
            showConfirmButton: false,
          })
        }
      />
    </div>
  );
}
