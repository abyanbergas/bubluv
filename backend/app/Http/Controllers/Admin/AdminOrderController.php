<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['items', 'payments']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('recipient_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('order_status')) {
            $query->where('order_status', $request->order_status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['items.product', 'payments', 'statusHistories', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);

        $validated = $request->validate([
            'order_status' => 'required|in:pending,confirmed,processing,shipped,completed,cancelled',
            'notes' => 'nullable|string|max:500',
        ]);

        $oldStatus = $order->order_status;
        $newStatus = $validated['order_status'];

        if ($oldStatus === $newStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Status pesanan tidak berubah.',
                'data' => $order,
            ]);
        }

        // Business Rule 9: Prevent illegal transitions from terminal states
        if ($oldStatus === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan yang telah dibatalkan tidak dapat diaktifkan kembali.',
            ], 422);
        }

        if ($oldStatus === 'completed' && $newStatus !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan yang telah selesai tidak dapat diubah kembali.',
            ], 422);
        }

        return DB::transaction(function () use ($order, $oldStatus, $newStatus, $validated) {
            // If newly cancelled, restore product stock
            if ($newStatus === 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock', $item->quantity);
                        }
                    }
                }
            }

            $order->update([
                'order_status' => $newStatus,
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => 'admin',
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'notes' => $validated['notes'] ?? ("Status diperbarui menjadi " . ucfirst($newStatus) . " oleh admin."),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Status pesanan berhasil diperbarui menjadi {$newStatus}.",
                'data' => $order->fresh(['items', 'statusHistories']),
            ]);
        });
    }
}
