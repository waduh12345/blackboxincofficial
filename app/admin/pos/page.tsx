"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Tag,
  Gift,
  Percent,
  Ticket,
  X,
  Check,
  Printer,
  Star,
  Crown,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetProductListQuery } from "@/services/product.service";
import { Product } from "@/types/admin/product";

// ==================== TYPES ====================
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  level: "Bronze" | "Silver" | "Gold" | "Platinum";
  points: number;
  totalSpent: number;
  joinDate: string;
  vouchers: string[]; // voucher IDs that belong to this customer
}

interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
  isGift?: boolean;
  giftReason?: string;
}

interface Voucher {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  validUntil: string;
  forCustomerIds: string[]; // empty = all customers
  usedCount: number;
  maxUsage: number;
}

interface Promo {
  id: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "gift";
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usedCount: number;
  maxUsage: number;
  giftProductId?: number;
  buyProductId?: number;
  buyQuantity?: number;
  getQuantity?: number;
}

type PaymentMethod = "cash" | "transfer" | "qris" | "va";

interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

// ==================== DUMMY DATA ====================
const DUMMY_CUSTOMERS: Customer[] = [
  {
    id: "C001",
    name: "Ahmad Rizki",
    phone: "081234567890",
    email: "ahmad.rizki@email.com",
    level: "Gold",
    points: 2500,
    totalSpent: 5000000,
    joinDate: "2024-01-15",
    vouchers: ["V001", "V003"],
  },
  {
    id: "C002",
    name: "Siti Nurhaliza",
    phone: "082345678901",
    email: "siti.nur@email.com",
    level: "Platinum",
    points: 8500,
    totalSpent: 15000000,
    joinDate: "2023-06-20",
    vouchers: ["V002", "V004"],
  },
  {
    id: "C003",
    name: "Budi Santoso",
    phone: "083456789012",
    email: "budi.s@email.com",
    level: "Silver",
    points: 1200,
    totalSpent: 2500000,
    joinDate: "2024-03-10",
    vouchers: ["V001"],
  },
  {
    id: "C004",
    name: "Dewi Lestari",
    phone: "084567890123",
    email: "dewi.l@email.com",
    level: "Bronze",
    points: 350,
    totalSpent: 750000,
    joinDate: "2024-06-01",
    vouchers: [],
  },
  {
    id: "C005",
    name: "Rudi Hermawan",
    phone: "085678901234",
    email: "rudi.h@email.com",
    level: "Gold",
    points: 3200,
    totalSpent: 6500000,
    joinDate: "2023-12-05",
    vouchers: ["V003", "V004"],
  },
];

const DUMMY_VOUCHERS: Voucher[] = [
  {
    id: "V001",
    code: "HEMAT20K",
    name: "Diskon Rp 20.000",
    type: "fixed",
    value: 20000,
    minPurchase: 100000,
    validUntil: "2026-03-31",
    forCustomerIds: ["C001", "C003"],
    usedCount: 5,
    maxUsage: 100,
  },
  {
    id: "V002",
    code: "VIP15",
    name: "Diskon 15% VIP",
    type: "percentage",
    value: 15,
    minPurchase: 200000,
    maxDiscount: 75000,
    validUntil: "2026-02-28",
    forCustomerIds: ["C002"],
    usedCount: 2,
    maxUsage: 10,
  },
  {
    id: "V003",
    code: "LOYAL10",
    name: "Loyal Customer 10%",
    type: "percentage",
    value: 10,
    minPurchase: 150000,
    maxDiscount: 50000,
    validUntil: "2026-06-30",
    forCustomerIds: ["C001", "C005"],
    usedCount: 8,
    maxUsage: 50,
  },
  {
    id: "V004",
    code: "SPECIAL50K",
    name: "Diskon Spesial Rp 50.000",
    type: "fixed",
    value: 50000,
    minPurchase: 300000,
    validUntil: "2026-01-31",
    forCustomerIds: ["C002", "C005"],
    usedCount: 15,
    maxUsage: 15, // Already exhausted
  },
];

const DUMMY_PROMOS: Promo[] = [
  {
    id: "P001",
    name: "Diskon Awal Tahun 25%",
    description: "Diskon 25% untuk semua produk herbal",
    type: "percentage",
    value: 25,
    minPurchase: 100000,
    maxDiscount: 100000,
    validFrom: "2026-01-01",
    validUntil: "2026-01-31",
    usedCount: 45,
    maxUsage: 100,
  },
  {
    id: "P002",
    name: "Cashback Rp 30.000",
    description: "Cashback untuk pembelian min Rp 250.000",
    type: "fixed",
    value: 30000,
    minPurchase: 250000,
    validFrom: "2026-01-15",
    validUntil: "2026-02-15",
    usedCount: 200,
    maxUsage: 200, // Exhausted
  },
  {
    id: "P003",
    name: "Beli 2 Gratis 1",
    description: "Beli 2 produk dapat 1 gratis (produk termurah)",
    type: "buy_x_get_y",
    value: 0,
    minPurchase: 0,
    validFrom: "2026-01-01",
    validUntil: "2026-03-31",
    usedCount: 30,
    maxUsage: 500,
    buyQuantity: 2,
    getQuantity: 1,
  },
  {
    id: "P004",
    name: "Free Gift Herbal Tea",
    description: "Gratis Herbal Tea untuk pembelian min Rp 500.000",
    type: "gift",
    value: 0,
    minPurchase: 500000,
    validFrom: "2026-01-01",
    validUntil: "2026-02-28",
    usedCount: 25,
    maxUsage: 100,
    giftProductId: 1, // Dummy product ID for gift
  },
];

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const getLevelColor = (level: Customer["level"]) => {
  switch (level) {
    case "Bronze":
      return "bg-amber-700";
    case "Silver":
      return "bg-gray-400";
    case "Gold":
      return "bg-yellow-500";
    case "Platinum":
      return "bg-purple-600";
    default:
      return "bg-gray-500";
  }
};

const getLevelIcon = (level: Customer["level"]) => {
  switch (level) {
    case "Platinum":
      return <Crown className="w-4 h-4" />;
    default:
      return <Star className="w-4 h-4" />;
  }
};

// ==================== MAIN COMPONENT ====================
export default function POSPage() {
  // Product data from API
  const { data: productsData, isLoading: isLoadingProducts } =
    useGetProductListQuery({ page: 1, paginate: 100 });
  const products = productsData?.data || [];

  // State
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Discount states
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return products;
    const term = searchProduct.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term)
    );
  }, [products, searchProduct]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchCustomer.trim()) return DUMMY_CUSTOMERS;
    const term = searchCustomer.toLowerCase();
    return DUMMY_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }, [searchCustomer]);

  // Get available vouchers for selected customer
  const availableVouchers = useMemo(() => {
    if (!selectedCustomer) return [];
    return DUMMY_VOUCHERS.filter(
      (v) =>
        v.forCustomerIds.includes(selectedCustomer.id) &&
        v.usedCount < v.maxUsage &&
        new Date(v.validUntil) >= new Date()
    );
  }, [selectedCustomer]);

  // Get available promos
  const availablePromos = useMemo(() => {
    const now = new Date();
    return DUMMY_PROMOS.filter(
      (p) =>
        p.usedCount < p.maxUsage &&
        new Date(p.validFrom) <= now &&
        new Date(p.validUntil) >= now
    );
  }, []);

  // Calculate cart totals
  const cartCalculations = useMemo(() => {
    const subtotal = cart
      .filter((item) => !item.isGift)
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    let pointsDiscount = 0;
    let voucherDiscount = 0;
    let promoDiscount = 0;

    // Points discount (1 point = Rp 100)
    if (usePoints && selectedCustomer && pointsToUse > 0) {
      pointsDiscount = Math.min(pointsToUse * 100, subtotal * 0.5); // Max 50% of subtotal
    }

    // Voucher discount
    if (selectedVoucher && subtotal >= selectedVoucher.minPurchase) {
      if (selectedVoucher.type === "percentage") {
        voucherDiscount = (subtotal * selectedVoucher.value) / 100;
        if (selectedVoucher.maxDiscount) {
          voucherDiscount = Math.min(voucherDiscount, selectedVoucher.maxDiscount);
        }
      } else {
        voucherDiscount = selectedVoucher.value;
      }
    }

    // Promo discount
    if (selectedPromo && subtotal >= selectedPromo.minPurchase) {
      if (selectedPromo.type === "percentage") {
        promoDiscount = (subtotal * selectedPromo.value) / 100;
        if (selectedPromo.maxDiscount) {
          promoDiscount = Math.min(promoDiscount, selectedPromo.maxDiscount);
        }
      } else if (selectedPromo.type === "fixed") {
        promoDiscount = selectedPromo.value;
      }
    }

    const totalDiscount = pointsDiscount + voucherDiscount + promoDiscount;
    const total = Math.max(0, subtotal - totalDiscount);
    const change = cashReceived > total ? cashReceived - total : 0;

    return {
      subtotal,
      pointsDiscount,
      voucherDiscount,
      promoDiscount,
      totalDiscount,
      total,
      change,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart, usePoints, pointsToUse, selectedCustomer, selectedVoucher, selectedPromo, cashReceived]);

  // Check for gift products based on promo
  useEffect(() => {
    if (selectedPromo?.type === "gift" && cartCalculations.subtotal >= selectedPromo.minPurchase) {
      // Add gift product if not already in cart
      const hasGift = cart.some((item) => item.isGift && item.giftReason === selectedPromo.id);
      if (!hasGift && products.length > 0) {
        const giftProduct = products[0]; // Use first product as gift for demo
        setCart((prev) => [
          ...prev,
          {
            product: giftProduct,
            quantity: 1,
            isGift: true,
            giftReason: selectedPromo.id,
          },
        ]);
      }
    } else {
      // Remove gift if promo conditions not met
      setCart((prev) => prev.filter((item) => !item.isGift || item.giftReason !== selectedPromo?.id));
    }
  }, [selectedPromo, cartCalculations.subtotal, products]);

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && !item.isGift);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && !item.isGift
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && !item.isGift) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId || item.isGift));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setUsePoints(false);
    setPointsToUse(0);
    setSelectedVoucher(null);
    setSelectedPromo(null);
    setVoucherCode("");
  };

  // Apply voucher by code
  const applyVoucherCode = () => {
    const voucher = DUMMY_VOUCHERS.find(
      (v) => v.code.toLowerCase() === voucherCode.toLowerCase()
    );
    if (!voucher) {
      alert("Kode voucher tidak ditemukan");
      return;
    }
    if (voucher.usedCount >= voucher.maxUsage) {
      alert("Voucher sudah habis digunakan");
      return;
    }
    if (new Date(voucher.validUntil) < new Date()) {
      alert("Voucher sudah kadaluarsa");
      return;
    }
    if (voucher.forCustomerIds.length > 0 && selectedCustomer) {
      if (!voucher.forCustomerIds.includes(selectedCustomer.id)) {
        alert("Voucher tidak berlaku untuk customer ini");
        return;
      }
    }
    setSelectedVoucher(voucher);
    setVoucherCode("");
  };

  // Process payment
  const processPayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const txId = `TRX${Date.now()}`;
    setTransactionId(txId);
    setTransactionComplete(true);
    setIsProcessing(false);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
  };

  // Print receipt
  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .total { font-weight: bold; font-size: 1.2em; }
            .center { text-align: center; }
            .small { font-size: 0.85em; color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // New transaction
  const newTransaction = () => {
    clearCart();
    setTransactionComplete(false);
    setTransactionId("");
    setShowReceiptModal(false);
    setCashReceived(0);
    setPaymentReference("");
  };

  // Simulate QR scan
  const simulateQRScan = () => {
    const randomCustomer = DUMMY_CUSTOMERS[Math.floor(Math.random() * DUMMY_CUSTOMERS.length)];
    setSelectedCustomer(randomCustomer);
    setShowQRScanner(false);
    setShowCustomerSearch(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS HerbalCare</h1>
              <p className="text-sm text-gray-500">Point of Sale System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Search Product */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Cari produk..."
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id && !item.isGift);
                const imageUrl =
                  typeof product.image === "string" && product.image
                    ? product.image
                    : "/placeholder-product.png";

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all text-left relative group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {cartItem && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {cartItem.quantity}
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-green-600 font-bold">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-gray-500">Stok: {product.stock}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-[420px] bg-white shadow-lg flex flex-col">
        {/* Customer Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">Customer</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustomerSearch(true)}
                className="h-8"
              >
                <User className="w-4 h-4 mr-1" />
                Cari
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQRScanner(true)}
                className="h-8"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Scan
              </Button>
            </div>
          </div>

          {selectedCustomer ? (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{selectedCustomer.name}</h3>
                    <Badge className={`${getLevelColor(selectedCustomer.level)} text-white text-xs`}>
                      {getLevelIcon(selectedCustomer.level)}
                      <span className="ml-1">{selectedCustomer.level}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedCustomer.phone}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{selectedCustomer.points.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">points</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada customer dipilih</p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">
              Keranjang ({cartCalculations.itemCount} item)
            </h2>
            {cart.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearCart} className="h-8 text-red-600">
                <Trash2 className="w-4 h-4 mr-1" />
                Hapus Semua
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    item.isGift ? "bg-green-50 border border-green-200" : "bg-gray-50"
                  }`}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={
                        typeof item.product.image === "string" && item.product.image
                          ? item.product.image
                          : "/placeholder-product.png"
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {item.isGift && (
                      <div className="absolute inset-0 bg-green-600/80 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    {item.isGift ? (
                      <p className="text-green-600 text-sm font-medium">GRATIS (Promo)</p>
                    ) : (
                      <p className="text-green-600 font-semibold text-sm">
                        {formatCurrency(item.product.price)}
                      </p>
                    )}
                  </div>
                  {!item.isGift && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="border-t p-4">
          <button
            onClick={() => setShowDiscountPanel(!showDiscountPanel)}
            className="w-full flex items-center justify-between text-gray-700 font-semibold"
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Diskon & Potongan
            </span>
            {showDiscountPanel ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDiscountPanel && (
            <div className="mt-3 space-y-3">
              {/* Points */}
              {selectedCustomer && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => {
                          setUsePoints(e.target.checked);
                          if (!e.target.checked) setPointsToUse(0);
                        }}
                        className="w-4 h-4"
                      />
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">Gunakan Points</span>
                    </label>
                    <span className="text-sm text-gray-600">
                      {selectedCustomer.points.toLocaleString()} pts tersedia
                    </span>
                  </div>
                  {usePoints && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={pointsToUse || ""}
                        onChange={(e) =>
                          setPointsToUse(
                            Math.min(Number(e.target.value), selectedCustomer.points)
                          )
                        }
                        placeholder="Jumlah points"
                        className="h-8"
                        max={selectedCustomer.points}
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        = {formatCurrency(pointsToUse * 100)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Voucher */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Voucher</span>
                </div>
                {selectedVoucher ? (
                  <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-200">
                    <div>
                      <p className="font-semibold text-sm">{selectedVoucher.name}</p>
                      <p className="text-xs text-purple-600">{selectedVoucher.code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedVoucher(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Masukkan kode voucher"
                        className="h-8"
                      />
                      <Button
                        size="sm"
                        onClick={applyVoucherCode}
                        disabled={!voucherCode.trim()}
                        className="h-8"
                      >
                        Pakai
                      </Button>
                    </div>
                    {selectedCustomer && availableVouchers.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 mb-1">Voucher tersedia:</p>
                        {availableVouchers.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVoucher(v)}
                            className="w-full text-left p-2 bg-white rounded border border-purple-100 hover:border-purple-300 transition-colors"
                          >
                            <p className="font-medium text-sm">{v.name}</p>
                            <p className="text-xs text-gray-500">
                              Min. {formatCurrency(v.minPurchase)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Promo */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Promo</span>
                </div>
                {selectedPromo ? (
                  <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-green-200">
                    <div>
                      <p className="font-semibold text-sm">{selectedPromo.name}</p>
                      <p className="text-xs text-green-600">{selectedPromo.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPromo(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availablePromos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPromo(p)}
                        className="w-full text-left p-2 bg-white rounded border border-green-100 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.type === "gift" && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <Gift className="w-3 h-3 mr-1" />
                              Gift
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{p.description}</p>
                        <p className="text-xs text-gray-400">
                          Tersisa: {p.maxUsage - p.usedCount} dari {p.maxUsage}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Total Section */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(cartCalculations.subtotal)}</span>
            </div>
            {cartCalculations.pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-yellow-600">
                <span>Diskon Points</span>
                <span>-{formatCurrency(cartCalculations.pointsDiscount)}</span>
              </div>
            )}
            {cartCalculations.voucherDiscount > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span>Diskon Voucher</span>
                <span>-{formatCurrency(cartCalculations.voucherDiscount)}</span>
              </div>
            )}
            {cartCalculations.promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Promo</span>
                <span>-{formatCurrency(cartCalculations.promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">{formatCurrency(cartCalculations.total)}</span>
            </div>
          </div>

          <Button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Bayar
          </Button>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Cari Customer</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowCustomerSearch(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  placeholder="Cari nama atau nomor HP..."
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => {
                  setShowCustomerSearch(false);
                  setShowQRScanner(true);
                }}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR Customer
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerSearch(false);
                      setSearchCustomer("");
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{customer.name}</span>
                          <Badge className={`${getLevelColor(customer.level)} text-white text-xs`}>
                            {customer.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-semibold">{customer.points.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
            <div className="mb-4">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <ScanLine className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Arahkan QR Code</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scan QR code member untuk mencari customer
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowQRScanner(false)}
              >
                Batal
              </Button>
              <Button className="flex-1" onClick={simulateQRScan}>
                Simulasi Scan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Pembayaran</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              {/* Total */}
              <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(cartCalculations.total)}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { id: "cash" as PaymentMethod, label: "Cash", icon: Banknote },
                  { id: "transfer" as PaymentMethod, label: "Transfer", icon: Building2 },
                  { id: "qris" as PaymentMethod, label: "QRIS", icon: QrCode },
                  { id: "va" as PaymentMethod, label: "Virtual Account", icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <method.icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        paymentMethod === method.id ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        paymentMethod === method.id ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {method.label}
                    </p>
                  </button>
                ))}
              </div>

              {/* Cash Input */}
              {paymentMethod === "cash" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uang Diterima
                  </label>
                  <Input
                    type="number"
                    value={cashReceived || ""}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder="Masukkan jumlah uang"
                    className="h-12 text-lg"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[50000, 100000, 200000, 500000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setCashReceived(amount)}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(cartCalculations.total)}
                    >
                      Uang Pas
                    </Button>
                  </div>
                  {cashReceived > cartCalculations.total && (
                    <p className="mt-2 text-green-600 font-semibold">
                      Kembalian: {formatCurrency(cashReceived - cartCalculations.total)}
                    </p>
                  )}
                </div>
              )}

              {/* Transfer / QRIS / VA */}
              {(paymentMethod === "transfer" || paymentMethod === "qris" || paymentMethod === "va") && (
                <div className="mb-4">
                  {paymentMethod === "qris" && (
                    <div className="bg-gray-100 rounded-xl p-6 mb-4 text-center">
                      <div className="w-32 h-32 mx-auto bg-white rounded-lg flex items-center justify-center mb-2">
                        <QrCode className="w-20 h-20 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">Scan QR untuk membayar</p>
                    </div>
                  )}
                  {paymentMethod === "va" && (
                    <div className="bg-gray-100 rounded-xl p-4 mb-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>
                      <p className="text-2xl font-mono font-bold">8888-0812-3456-7890</p>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Referensi / Bukti Transfer
                  </label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Masukkan nomor referensi"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={processPayment}
                disabled={
                  isProcessing ||
                  (paymentMethod === "cash" && cashReceived < cartCalculations.total)
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Konfirmasi Bayar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Transaksi Berhasil
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowReceiptModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">HerbalCare</h2>
                <p className="text-sm text-gray-500">Jl. Sehat No. 123, Jakarta</p>
                <p className="text-sm text-gray-500">Telp: 021-1234567</p>
                <div className="my-3 border-t border-dashed"></div>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-500">No: {transactionId}</p>
              </div>

              {selectedCustomer && (
                <div className="mb-3 pb-3 border-b border-dashed">
                  <p className="text-sm">
                    <span className="text-gray-500">Customer:</span> {selectedCustomer.name}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Member:</span> {selectedCustomer.level}
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.isGift ? "GRATIS" : `${item.quantity} x ${formatCurrency(item.product.price)}`}
                      </p>
                    </div>
                    <p className="font-medium">
                      {item.isGift ? "Rp 0" : formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartCalculations.subtotal)}</span>
                </div>
                {cartCalculations.pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-yellow-600">
                    <span>Diskon Points</span>
                    <span>-{formatCurrency(cartCalculations.pointsDiscount)}</span>
                  </div>
                )}
                {cartCalculations.voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Diskon Voucher</span>
                    <span>-{formatCurrency(cartCalculations.voucherDiscount)}</span>
                  </div>
                )}
                {cartCalculations.promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon Promo</span>
                    <span>-{formatCurrency(cartCalculations.promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
                  <span>TOTAL</span>
                  <span>{formatCurrency(cartCalculations.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bayar ({paymentMethod.toUpperCase()})</span>
                  <span>{formatCurrency(paymentMethod === "cash" ? cashReceived : cartCalculations.total)}</span>
                </div>
                {paymentMethod === "cash" && cashReceived > cartCalculations.total && (
                  <div className="flex justify-between text-sm">
                    <span>Kembalian</span>
                    <span>{formatCurrency(cashReceived - cartCalculations.total)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center border-t border-dashed pt-4">
                <p className="text-sm text-gray-500">Terima kasih telah berbelanja!</p>
                <p className="text-xs text-gray-400 mt-1">
                  Barang yang sudah dibeli tidak dapat dikembalikan
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={printReceipt}>
                <Printer className="w-4 h-4 mr-2" />
                Cetak Struk
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={newTransaction}>
                Transaksi Baru
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}