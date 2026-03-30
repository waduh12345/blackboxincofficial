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
import { useGetDashboardQuery } from "@/services/admin/dashboard.service";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type TimeRange = "today" | "week" | "month";

export default function ModernDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  const { data: dashboard, isLoading, isError } = useGetDashboardQuery({ range: timeRange });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale });
    } catch {
      return dateStr;
    }
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Selesai",
      pending: "Menunggu",
      processing: "Proses",
      failed: "Gagal",
    };
    return labels[status] || status;
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Memuat data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Gagal memuat data dashboard.</p>
          <p className="text-red-500 text-sm mt-1">Pastikan endpoint API /dashboard sudah tersedia.</p>
        </div>
      </div>
    );
  }

  const d = dashboard;
  const salesTrend = d.sales.trend >= 0 ? "up" : "down";
  const ordersGrowth = d.orders.today_orders > 0 ? "up" : "down";

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
            {(["today", "week", "month"] as TimeRange[]).map((range) => (
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
          title="Penjualan"
          value={formatRupiah(d.sales.current)}
          subtitle={`vs sebelumnya: ${formatRupiah(d.sales.previous)}`}
          icon={DollarSign}
          trend={salesTrend}
          trendValue={Math.abs(d.sales.trend)}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pesanan Hari Ini"
          value={d.orders.today_orders}
          subtitle={`${d.orders.pending} menunggu`}
          icon={ShoppingCart}
          trend={ordersGrowth}
          trendValue={d.orders.today_orders}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Reseller Aktif"
          value={d.resellers.active}
          subtitle={`+${d.resellers.new_this_month} bulan ini`}
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Profit Margin"
          value={`${d.cashflow.margin}%`}
          subtitle={formatRupiah(d.cashflow.profit)}
          icon={TrendingUp}
          trend={d.cashflow.margin > 0 ? "up" : "down"}
          trendValue={d.cashflow.margin}
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
                  <p className="font-semibold text-gray-900">{d.payments.completed_count} Berhasil</p>
                  <p className="text-sm text-gray-600">{formatRupiah(d.payments.completed_amount)}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">{d.payments.pending_count} Menunggu</p>
                  <p className="text-sm text-gray-600">{formatRupiah(d.payments.pending_amount)}</p>
                </div>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900">{d.payments.failed_count} Gagal</p>
                  <p className="text-sm text-gray-600">{formatRupiah(d.payments.failed_amount)}</p>
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
                <p className="text-xl font-bold text-blue-600">{formatRupiah(d.cashflow.income)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                <p className="text-xl font-bold text-red-600">{formatRupiah(d.cashflow.expenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Profit Bersih</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(d.cashflow.profit)}</p>
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
          {d.top_resellers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada data reseller</p>
            </div>
          ) : (
            <div className="space-y-3">
              {d.top_resellers.map((reseller, idx) => (
                <div key={reseller.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{reseller.name}</p>
                      <p className="text-sm text-gray-600">{reseller.total_orders} pesanan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatRupiah(reseller.total_sales)}</p>
                    <div className={`flex items-center gap-1 text-xs font-medium ${reseller.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reseller.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(reseller.growth)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2>
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          {d.recent_transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {d.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{transaction.customer_name}</p>
                    <p className="text-xs text-gray-500">{transaction.reference}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(transaction.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 mb-1">{formatRupiah(transaction.amount)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <p className="text-2xl font-bold text-yellow-600">{d.operations.stock_low}</p>
            <p className="text-xs text-gray-600 mt-1">Produk perlu restock</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Pending Kirim</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{d.operations.pending_shipment}</p>
            <p className="text-xs text-gray-600 mt-1">Menunggu pengiriman</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-gray-700">Customer Support</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{d.operations.customer_support}</p>
            <p className="text-xs text-gray-600 mt-1">Tiket aktif</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Avg Response</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{d.operations.avg_response_time}</p>
            <p className="text-xs text-gray-600 mt-1">Waktu respon rata-rata</p>
          </div>
        </div>
      </div>
    </div>
  );
}
