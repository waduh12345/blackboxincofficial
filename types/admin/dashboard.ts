// Dashboard API Response Types

export interface DashboardSales {
  current: number;
  previous: number;
  current_month: number;
  previous_month: number;
  trend: number;
}

export interface DashboardPayments {
  pending_count: number;
  pending_amount: number;
  completed_count: number;
  completed_amount: number;
  failed_count: number;
  failed_amount: number;
}

export interface DashboardOrders {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  completed: number;
  today_orders: number;
}

export interface DashboardResellers {
  active: number;
  new_this_month: number;
  total_sales: number;
  commission: number;
}

export interface DashboardCashflow {
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface DashboardOperations {
  stock_low: number;
  pending_shipment: number;
  customer_support: number;
  avg_response_time: string;
}

export interface DashboardRecentTransaction {
  id: number;
  reference: string;
  customer_name: string;
  amount: number;
  status: "completed" | "pending" | "processing" | "failed";
  created_at: string;
}

export interface DashboardTopReseller {
  id: number;
  name: string;
  total_sales: number;
  total_orders: number;
  commission: number;
  growth: number;
}

export interface DashboardData {
  sales: DashboardSales;
  payments: DashboardPayments;
  orders: DashboardOrders;
  resellers: DashboardResellers;
  cashflow: DashboardCashflow;
  operations: DashboardOperations;
  recent_transactions: DashboardRecentTransaction[];
  top_resellers: DashboardTopReseller[];
}

export interface DashboardParams {
  range?: "today" | "week" | "month";
}

export interface DashboardApiResponse {
  code: number;
  message: string;
  data: DashboardData;
}
