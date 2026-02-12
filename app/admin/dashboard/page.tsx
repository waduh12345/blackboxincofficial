"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  CheckCircle,
  CreditCard,
  Wallet,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle,
  Zap,
  type LucideIcon
} from "lucide-react";

// Mock Data
const dashboardData = {
  sales: {
    today: 15750000,
    yesterday: 12300000,
    thisMonth: 125430000,
    lastMonth: 98200000,
    trend: 27.7
  },
  payments: {
    pending: 5,
    pendingAmount: 3250000,
    completed: 42,
    completedAmount: 15750000,
    failed: 2,
    failedAmount: 450000
  },
  orders: {
    total: 1247,
    pending: 23,
    processing: 15,
    shipped: 156,
    completed: 1068,
    todayOrders: 47
  },
  resellers: {
    active: 85,
    newThisMonth: 12,
    totalSales: 45800000,
    topPerformer: "Reseller Premium",
    commission: 4580000
  },
  cashflow: {
    income: 125430000,
    expenses: 45200000,
    profit: 80230000,
    margin: 64.0
  },
  operations: {
    stockLow: 8,
    pendingShipment: 23,
    customerSupport: 5,
    avgResponseTime: "2.5 jam"
  }
};

const recentTransactions = [
  { id: "#ORD-2024-001", customer: "Budi Santoso", amount: 1250000, status: "completed", time: "5 menit lalu" },
  { id: "#ORD-2024-002", customer: "Siti Rahayu", amount: 850000, status: "pending", time: "15 menit lalu" },
  { id: "#ORD-2024-003", customer: "Ahmad Yani", amount: 2100000, status: "processing", time: "32 menit lalu" },
  { id: "#ORD-2024-004", customer: "Dewi Lestari", amount: 650000, status: "completed", time: "1 jam lalu" },
];

const topResellers = [
  { name: "Reseller Premium", sales: 12500000, orders: 45, commission: 1250000, growth: 15.5 },
  { name: "Toko Sejahtera", sales: 9800000, orders: 38, commission: 980000, growth: 8.2 },
  { name: "Mitra Sukses", sales: 7600000, orders: 29, commission: 760000, growth: -2.1 },
  { name: "Distributor Utama", sales: 6200000, orders: 24, commission: 620000, growth: 12.8 },
];

export default function ModernDashboard() {
  const [timeRange, setTimeRange] = useState("today");

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      failed: "bg-red-100 text-red-700"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: "up" | "down";
    trendValue?: number | string;
    color?: string;
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }: StatCardProps) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendValue}%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor performa bisnis Anda secara realtime</p>
          </div>
          <div className="flex gap-2">
            {["today", "week", "month"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {range === "today" ? "Hari Ini" : range === "week" ? "Minggu Ini" : "Bulan Ini"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(dashboardData.sales.today)}
          subtitle="vs kemarin"
          icon={DollarSign}
          trend="up"
          trendValue={dashboardData.sales.trend}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Pesanan"
          value={dashboardData.orders.todayOrders}
          subtitle={`${dashboardData.orders.pending} menunggu`}
          icon={ShoppingCart}
          trend="up"
          trendValue="12.5"
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Reseller Aktif"
          value={dashboardData.resellers.active}
          subtitle={`+${dashboardData.resellers.newThisMonth} bulan ini`}
          icon={Users}
          trend="up"
          trendValue="14.1"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Profit Margin"
          value={`${dashboardData.cashflow.margin}%`}
          subtitle={formatRupiah(dashboardData.cashflow.profit)}
          icon={TrendingUp}
          trend="up"
          trendValue="8.3"
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Payment Status & Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Monitor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Status Pembayaran</h2>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">{dashboardData.payments.completed} Berhasil</p>
                  <p className="text-sm text-gray-600">{formatRupiah(dashboardData.payments.completedAmount)}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">{dashboardData.payments.pending} Menunggu</p>
                  <p className="text-sm text-gray-600">{formatRupiah(dashboardData.payments.pendingAmount)}</p>
                </div>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">{dashboardData.payments.failed} Gagal</p>
                  <p className="text-sm text-gray-600">{formatRupiah(dashboardData.payments.failedAmount)}</p>
                </div>
              </div>
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Cashflow Monitor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Cashflow Bulan Ini</h2>
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
                <p className="text-xl font-bold text-blue-600">{formatRupiah(dashboardData.cashflow.income)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                <p className="text-xl font-bold text-red-600">{formatRupiah(dashboardData.cashflow.expenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Profit Bersih</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(dashboardData.cashflow.profit)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reseller Performance & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Resellers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Reseller</h2>
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="space-y-3">
            {topResellers.map((reseller, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{reseller.name}</p>
                    <p className="text-sm text-gray-600">{reseller.orders} pesanan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatRupiah(reseller.sales)}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${reseller.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reseller.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(reseller.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2>
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{transaction.customer}</p>
                  <p className="text-xs text-gray-500">{transaction.id}</p>
                  <p className="text-xs text-gray-400 mt-1">{transaction.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 mb-1">{formatRupiah(transaction.amount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status === 'completed' ? 'Selesai' : transaction.status === 'pending' ? 'Menunggu' : 'Proses'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Monitor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Monitor Operasional</h2>
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-gray-700">Stok Menipis</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{dashboardData.operations.stockLow}</p>
            <p className="text-xs text-gray-600 mt-1">Produk perlu restock</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Pending Kirim</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{dashboardData.operations.pendingShipment}</p>
            <p className="text-xs text-gray-600 mt-1">Menunggu pengiriman</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-gray-700">Customer Support</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{dashboardData.operations.customerSupport}</p>
            <p className="text-xs text-gray-600 mt-1">Tiket aktif</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Avg Response</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{dashboardData.operations.avgResponseTime}</p>
            <p className="text-xs text-gray-600 mt-1">Waktu respon rata-rata</p>
          </div>
        </div>
      </div>
    </div>
  );
}