<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Create order from checkout
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:25',
            'shipping_address' => 'required|string',
            'shipping_method' => 'required|string',
            'shipping_cost' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:manual_transfer,gateway_qris,gateway_ewallet,gateway_va,cod',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user) {
            $subtotal = 0;
            $orderItemsData = [];

            // 1. Validate real price and stock from database
            foreach ($validated['items'] as $item) {
                // Lock product row for update to avoid race conditions
                $product = Product::lockForUpdate()->find($item['product_id']);

                if (!$product || !$product->is_active) {
                    abort(422, "Produk '{$product->name}' sedang tidak aktif atau tidak tersedia.");
                }

                $variant = null;
                $effectivePrice = $product->effective_price;
                $sku = $product->sku;

                if (!empty($item['variant_id'])) {
                    $variant = ProductVariant::lockForUpdate()
                        ->where('id', $item['variant_id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if (!$variant || !$variant->is_active) {
                        abort(422, "Varian produk '{$product->name}' tidak valid.");
                    }

                    $effectivePrice += $variant->price_adjustment;
                    $sku = $variant->sku ?: $sku;

                    // Check variant stock
                    if ($variant->stock < $item['quantity']) {
                        abort(422, "Stok varian '{$variant->variant_name}' untuk {$product->name} tidak mencukupi (sisa {$variant->stock}).");
                    }

                    // Deduct variant stock
                    $variant->decrement('stock', $item['quantity']);
                } else {
                    // Check base product stock
                    if ($product->stock < $item['quantity']) {
                        abort(422, "Stok produk '{$product->name}' tidak mencukupi (sisa {$product->stock}).");
                    }
                }

                // Deduct base product stock
                $product->decrement('stock', $item['quantity']);

                $lineSubtotal = $effectivePrice * $item['quantity'];
                $subtotal += $lineSubtotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'variant_name' => $variant ? $variant->variant_name : null,
                    'sku' => $sku,
                    'unit_price' => $effectivePrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $lineSubtotal,
                ];
            }

            $shippingCost = (float) $validated['shipping_cost'];
            $discountAmount = 0; // Can be expanded for promotional voucher calculation
            $total = $subtotal + $shippingCost - $discountAmount;

            // Generate unique Order Number: BLV-20261028-XXXX
            $orderNumber = 'BLV-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $initialPaymentStatus = 'unpaid';
            $initialOrderStatus = 'pending';

            $order = Order::create([
                'user_id' => $user ? $user->id : null,
                'order_number' => $orderNumber,
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'shipping_address' => $validated['shipping_address'],
                'shipping_method' => $validated['shipping_method'],
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $initialPaymentStatus,
                'order_status' => $initialOrderStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Save order items
            foreach ($orderItemsData as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            // Create payment record
            $provider = 'manual';
            if (str_starts_with($validated['payment_method'], 'gateway_')) {
                $provider = 'midtrans_sandbox';
            } elseif ($validated['payment_method'] === 'cod') {
                $provider = 'cod';
            }

            Payment::create([
                'order_id' => $order->id,
                'provider' => $provider,
                'payment_method' => $validated['payment_method'],
                'amount' => $total,
                'payment_status' => $initialPaymentStatus,
            ]);

            // Log status history
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => $user ? 'customer' : 'guest',
                'old_status' => null,
                'new_status' => 'pending',
                'notes' => 'Pesanan berhasil dibuat.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => [
                    'order_number' => $order->order_number,
                    'total' => $order->total,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                ],
            ], 201);
        });
    }

    /**
     * Show order detail and tracking by order_number
     */
    public function show($orderNumber, Request $request)
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product', 'payments', 'statusHistories'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        // Check customer privacy: if user is authenticated and order belongs to another user
        $user = $request->user();
        if ($user && $order->user_id && $user->role !== 'admin' && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke pesanan ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * List customer's orders
     */
    public function customerOrders(Request $request)
    {
        $user = $request->user();

        $orders = Order::where('user_id', $user->id)
            ->with(['items', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Upload payment proof for manual bank transfer
     */
    public function uploadPaymentProof($orderNumber, Request $request)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // max 5MB
        ]);

        $order = Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        if ($request->hasFile('payment_proof')) {
            $path = $request->file('payment_proof')->store('proofs', 'public');

            $payment = Payment::where('order_id', $order->id)->latest()->first();
            if ($payment) {
                $payment->update([
                    'payment_proof' => '/storage/' . $path,
                    'payment_status' => 'pending_verification',
                ]);
            }

            $order->update([
                'payment_status' => 'pending_verification',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'changed_by' => 'customer',
                'old_status' => $order->order_status,
                'new_status' => $order->order_status,
                'notes' => 'Bukti transfer diunggah oleh pelanggan, menunggu verifikasi admin.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah. Tim admin BubLuv akan segera memverifikasinya.',
                'proof_url' => '/storage/' . $path,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'File bukti transfer tidak ditemukan.',
        ], 422);
    }
}
