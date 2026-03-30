# Dashboard API Specification

## Endpoint

```
GET /api/v1/dashboard
```

**Auth:** Bearer Token (admin/superadmin only)

**Query Parameters:**

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| `range`   | string | No       | `today` | Filter range: `today`, `week`, `month` |

---

## Response

```json
{
  "code": 200,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "sales": {
      "current": 15750000,
      "previous": 12300000,
      "current_month": 125430000,
      "previous_month": 98200000,
      "trend": 27.7
    },
    "payments": {
      "pending_count": 5,
      "pending_amount": 3250000,
      "completed_count": 42,
      "completed_amount": 15750000,
      "failed_count": 2,
      "failed_amount": 450000
    },
    "orders": {
      "total": 1247,
      "pending": 23,
      "processing": 15,
      "shipped": 156,
      "completed": 1068,
      "today_orders": 47
    },
    "resellers": {
      "active": 85,
      "new_this_month": 12,
      "total_sales": 45800000,
      "commission": 4580000
    },
    "cashflow": {
      "income": 125430000,
      "expenses": 45200000,
      "profit": 80230000,
      "margin": 64.0
    },
    "operations": {
      "stock_low": 8,
      "pending_shipment": 23,
      "customer_support": 5,
      "avg_response_time": "2.5 jam"
    },
    "recent_transactions": [
      {
        "id": 1,
        "reference": "#ORD-2024-001",
        "customer_name": "Budi Santoso",
        "amount": 1250000,
        "status": "completed",
        "created_at": "2026-03-30T10:25:00Z"
      }
    ],
    "top_resellers": [
      {
        "id": 1,
        "name": "Reseller Premium",
        "total_sales": 12500000,
        "total_orders": 45,
        "commission": 1250000,
        "growth": 15.5
      }
    ]
  }
}
```

---

## Laravel Implementation Prompt

Salin prompt di bawah ini ke dalam project Laravel kamu:

---

### Prompt untuk Laravel:

```
Buatkan endpoint dashboard untuk admin panel dengan spesifikasi berikut:

## Route
Tambahkan route di routes/api.php (di dalam group middleware auth:sanctum atau middleware admin):

Route::get('/dashboard', [DashboardController::class, 'index']);

## Controller: DashboardController

Buat file: app/Http/Controllers/Api/V1/DashboardController.php

Method: index(Request $request)
- Menerima query parameter: range (today|week|month), default: today

Logic per section:

### 1. SALES
- `current`: Total grand_total dari tabel transactions WHERE status IN (1,2) berdasarkan range
  - today: WHERE DATE(created_at) = today
  - week: WHERE created_at >= start of this week
  - month: WHERE created_at >= start of this month
- `previous`: Sama tapi periode sebelumnya (kemarin / minggu lalu / bulan lalu)
- `current_month`: Total grand_total bulan ini
- `previous_month`: Total grand_total bulan lalu
- `trend`: Persentase perubahan = ((current - previous) / previous) * 100, round to 1 decimal

### 2. PAYMENTS
Query dari tabel transactions berdasarkan range yang sama:
- `pending_count`: COUNT WHERE status = 0
- `pending_amount`: SUM(grand_total) WHERE status = 0
- `completed_count`: COUNT WHERE status IN (1,2)
- `completed_amount`: SUM(grand_total) WHERE status IN (1,2)
- `failed_count`: COUNT WHERE status IN (-1,-2,-3)
- `failed_amount`: SUM(grand_total) WHERE status IN (-1,-2,-3)

### 3. ORDERS
- `total`: COUNT semua transaksi (all time)
- `pending`: COUNT WHERE status = 0
- `processing`: COUNT WHERE status = 1 (captured tapi belum shipped)
- `shipped`: COUNT transaction_shops WHERE shipment_status = 1
- `completed`: COUNT WHERE status = 2
- `today_orders`: COUNT WHERE DATE(created_at) = today

### 4. RESELLERS
Jika ada tabel reseller/users with role reseller:
- `active`: COUNT users yang punya role reseller dan punya transaksi dalam 30 hari terakhir
- `new_this_month`: COUNT users role reseller yang created_at bulan ini
- `total_sales`: SUM grand_total dari transaksi reseller bulan ini
- `commission`: total_sales * 0.10 (atau dari tabel komisi jika ada)

Jika belum ada fitur reseller, hardcode semua ke 0.

### 5. CASHFLOW
- `income`: SUM(amount) dari tabel incomes (cash/income) berdasarkan range bulan ini
- `expenses`: SUM(amount) dari tabel expenses (cash/expense) berdasarkan range bulan ini
- `profit`: income - expenses
- `margin`: (profit / income) * 100, round to 1 decimal. Jika income = 0, margin = 0

### 6. OPERATIONS
- `stock_low`: COUNT products yang memiliki total stock (dari product_variant_sizes atau product_variants) <= 5
- `pending_shipment`: COUNT transaction_shops WHERE shipment_status = 0 AND transaction.status IN (1,2)
- `customer_support`: 0 (placeholder, bisa diisi jika ada tabel tiket support)
- `avg_response_time`: "0 jam" (placeholder)

### 7. RECENT TRANSACTIONS
- Query: 5 transaksi terbaru ORDER BY created_at DESC
- Return fields: id, reference, user_name (dari relasi user atau guest_name), grand_total as amount, status (mapped: 0=pending, 1=processing, 2=completed, -1/-2/-3=failed), created_at

### 8. TOP RESELLERS
Jika ada fitur reseller:
- Query: Top 5 reseller berdasarkan total penjualan bulan ini
- Return: id, name, total_sales, total_orders, commission, growth (perbandingan dengan bulan lalu)

Jika belum ada, return array kosong [].

## Response Format
Selalu wrap response dengan format standar:
{
  "code": 200,
  "message": "Dashboard data retrieved successfully",
  "data": { ... semua section di atas ... }
}

## Migration (jika diperlukan)
Tidak perlu migration baru. Semua data diambil dari tabel yang sudah ada:
- transactions (status: 0=pending, 1=captured, 2=settlement, -1=deny, -2=expired, -3=cancel, -4=retur)
- transaction_shops (receipt_code, shipment_status: 0=pending, 1=shipped, 2=delivered)
- incomes (model Income, tabel cash/income)
- expenses (model Expense, tabel cash/expense)
- users (dengan roles)
- products, product_variants, product_variant_sizes (untuk stock)

## Contoh Controller Skeleton:

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\TransactionShop;
use App\Models\Income;
use App\Models\Expense;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $range = $request->get('range', 'today');

        // Determine date ranges
        switch ($range) {
            case 'week':
                $currentStart = Carbon::now()->startOfWeek();
                $currentEnd = Carbon::now()->endOfWeek();
                $previousStart = Carbon::now()->subWeek()->startOfWeek();
                $previousEnd = Carbon::now()->subWeek()->endOfWeek();
                break;
            case 'month':
                $currentStart = Carbon::now()->startOfMonth();
                $currentEnd = Carbon::now()->endOfMonth();
                $previousStart = Carbon::now()->subMonth()->startOfMonth();
                $previousEnd = Carbon::now()->subMonth()->endOfMonth();
                break;
            default: // today
                $currentStart = Carbon::today();
                $currentEnd = Carbon::today()->endOfDay();
                $previousStart = Carbon::yesterday();
                $previousEnd = Carbon::yesterday()->endOfDay();
                break;
        }

        // 1. SALES
        $currentSales = Transaction::whereIn('status', [1, 2])
            ->whereBetween('created_at', [$currentStart, $currentEnd])
            ->sum('grand_total');

        $previousSales = Transaction::whereIn('status', [1, 2])
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->sum('grand_total');

        $currentMonthSales = Transaction::whereIn('status', [1, 2])
            ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->sum('grand_total');

        $previousMonthSales = Transaction::whereIn('status', [1, 2])
            ->whereBetween('created_at', [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()])
            ->sum('grand_total');

        $salesTrend = $previousSales > 0
            ? round((($currentSales - $previousSales) / $previousSales) * 100, 1)
            : 0;

        // 2. PAYMENTS
        $paymentsPending = Transaction::where('status', 0)
            ->whereBetween('created_at', [$currentStart, $currentEnd]);
        $paymentsCompleted = Transaction::whereIn('status', [1, 2])
            ->whereBetween('created_at', [$currentStart, $currentEnd]);
        $paymentsFailed = Transaction::whereIn('status', [-1, -2, -3])
            ->whereBetween('created_at', [$currentStart, $currentEnd]);

        // 3. ORDERS
        $totalOrders = Transaction::count();
        $pendingOrders = Transaction::where('status', 0)->count();
        $processingOrders = Transaction::where('status', 1)->count();
        $shippedOrders = TransactionShop::where('shipment_status', 1)->count();
        $completedOrders = Transaction::where('status', 2)->count();
        $todayOrders = Transaction::whereDate('created_at', Carbon::today())->count();

        // 4. RESELLERS (sesuaikan dengan model role kamu)
        // Jika belum ada fitur reseller, set semua ke 0
        $resellersData = [
            'active' => 0,
            'new_this_month' => 0,
            'total_sales' => 0,
            'commission' => 0,
        ];

        // 5. CASHFLOW
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $totalIncome = Income::whereBetween('received_at', [$monthStart, $monthEnd])->sum('amount');
        $totalExpenses = Expense::whereBetween('incurred_at', [$monthStart, $monthEnd])->sum('amount');
        $profit = $totalIncome - $totalExpenses;
        $margin = $totalIncome > 0 ? round(($profit / $totalIncome) * 100, 1) : 0;

        // 6. OPERATIONS
        $stockLow = Product::whereHas('variants.sizes', function ($q) {
            $q->where('stock', '<=', 5);
        })->count();
        // Alternatif jika tidak ada sizes: Product::whereHas('variants', fn($q) => $q->where('stock', '<=', 5))->count();

        $pendingShipment = TransactionShop::where('shipment_status', 0)
            ->whereHas('transaction', function ($q) {
                $q->whereIn('status', [1, 2]);
            })->count();

        // 7. RECENT TRANSACTIONS
        $recentTransactions = Transaction::orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($tx) {
                $statusMap = [
                    0 => 'pending',
                    1 => 'processing',
                    2 => 'completed',
                    -1 => 'failed',
                    -2 => 'failed',
                    -3 => 'failed',
                    -4 => 'failed',
                ];
                return [
                    'id' => $tx->id,
                    'reference' => $tx->reference,
                    'customer_name' => $tx->user ? $tx->user->name : ($tx->guest_name ?? 'Guest'),
                    'amount' => (int) $tx->grand_total,
                    'status' => $statusMap[$tx->status] ?? 'unknown',
                    'created_at' => $tx->created_at->toIso8601String(),
                ];
            });

        // 8. TOP RESELLERS (placeholder - sesuaikan jika ada fitur reseller)
        $topResellers = [];

        return response()->json([
            'code' => 200,
            'message' => 'Dashboard data retrieved successfully',
            'data' => [
                'sales' => [
                    'current' => (int) $currentSales,
                    'previous' => (int) $previousSales,
                    'current_month' => (int) $currentMonthSales,
                    'previous_month' => (int) $previousMonthSales,
                    'trend' => $salesTrend,
                ],
                'payments' => [
                    'pending_count' => $paymentsPending->count(),
                    'pending_amount' => (int) $paymentsPending->sum('grand_total'),
                    'completed_count' => $paymentsCompleted->count(),
                    'completed_amount' => (int) $paymentsCompleted->sum('grand_total'),
                    'failed_count' => $paymentsFailed->count(),
                    'failed_amount' => (int) $paymentsFailed->sum('grand_total'),
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'pending' => $pendingOrders,
                    'processing' => $processingOrders,
                    'shipped' => $shippedOrders,
                    'completed' => $completedOrders,
                    'today_orders' => $todayOrders,
                ],
                'resellers' => $resellersData,
                'cashflow' => [
                    'income' => (int) $totalIncome,
                    'expenses' => (int) $totalExpenses,
                    'profit' => (int) $profit,
                    'margin' => $margin,
                ],
                'operations' => [
                    'stock_low' => $stockLow,
                    'pending_shipment' => $pendingShipment,
                    'customer_support' => 0,
                    'avg_response_time' => '0 jam',
                ],
                'recent_transactions' => $recentTransactions,
                'top_resellers' => $topResellers,
            ],
        ]);
    }
}
```

## Route Registration

Di file `routes/api.php`, tambahkan di dalam group yang sudah ada:

```php
// Di dalam group middleware auth:sanctum (atau middleware admin yang sudah ada)
Route::get('/dashboard', [DashboardController::class, 'index']);
```

## Catatan Penting

1. **Model Names**: Sesuaikan nama model (`Transaction`, `TransactionShop`, `Income`, `Expense`, `Product`) dengan yang sudah ada di project Laravel kamu.

2. **Relasi `variants.sizes`**: Untuk menghitung stock_low, pastikan relasi `Product->variants()->sizes()` sudah ada. Jika struktur berbeda, sesuaikan query-nya.

3. **Relasi `transaction` di TransactionShop**: Pastikan `TransactionShop` punya relasi `belongsTo(Transaction::class)`.

4. **Income & Expense fields**:
   - Income menggunakan field `received_at` untuk tanggal
   - Expense menggunakan field `incurred_at` untuk tanggal
   - Keduanya punya field `amount`

5. **Reseller**: Section reseller di-placeholder-kan dengan 0. Jika nanti ada fitur reseller, tinggal isi logic-nya.

6. **Performance**: Untuk production, pertimbangkan cache response selama 5 menit menggunakan `Cache::remember()`.
