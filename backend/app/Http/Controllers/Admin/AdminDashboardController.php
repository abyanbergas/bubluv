<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::where('is_active', true)->count();
        $totalCategories = Category::where('is_active', true)->count();
        $newOrders = Order::where('order_status', 'pending')->count();
        $processingOrders = Order::where('order_status', 'processing')->count();
        
        // Total sales from paid orders
        $totalSales = Order::where('payment_status', 'paid')
            ->where('order_status', '!=', 'cancelled')
            ->sum('total');

        $totalCustomers = User::where('role', 'customer')->count();

        // Low stock products alert (stock <= 20)
        $lowStockProducts = Product::where('stock', '<=', 20)
            ->where('is_active', true)
            ->select('id', 'name', 'stock', 'sku', 'price')
            ->orderBy('stock', 'asc')
            ->limit(10)
            ->get();

        // Recent orders
        $recentOrders = Order::with('items')
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get();

        // Monthly sales grouping for chart (last 6 months)
        $monthlySales = Order::where('payment_status', 'paid')
            ->where('order_status', '!=', 'cancelled')
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%b %Y') as month"),
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as sort_key"),
                DB::raw("SUM(total) as revenue"),
                DB::raw("COUNT(*) as total_orders")
            )
            ->groupBy('month', 'sort_key')
            ->orderBy('sort_key', 'asc')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_products' => $totalProducts,
                'total_categories' => $totalCategories,
                'new_orders' => $newOrders,
                'processing_orders' => $processingOrders,
                'total_sales' => (float) $totalSales,
                'total_customers' => $totalCustomers,
                'low_stock_products' => $lowStockProducts,
                'recent_orders' => $recentOrders,
                'monthly_sales' => $monthlySales,
            ],
        ]);
    }
}
