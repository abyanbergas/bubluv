<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Simulate Payment Gateway Sandbox Callback (QRIS, E-Wallet, VA)
     */
    public function simulateSandbox(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|exists:orders,order_number',
            'status' => 'required|in:settlement,pending,failed,expired',
            'transaction_reference' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $order = Order::where('order_number', $validated['order_number'])->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan.',
                ], 404);
            }

            $payment = Payment::where('order_id', $order->id)->latest()->first();

            $status = $validated['status'];
            $trxRef = $validated['transaction_reference'] ?? ('GW-SIM-' . time());

            if ($status === 'settlement') {
                if ($order->payment_status === 'paid') {
                    // Idempotent response
                    return response()->json([
                        'success' => true,
                        'message' => 'Pembayaran sudah terverifikasi sebelumnya.',
                    ]);
                }

                $order->update([
                    'payment_status' => 'paid',
                    'order_status' => ($order->order_status === 'pending') ? 'confirmed' : $order->order_status,
                ]);

                if ($payment) {
                    $payment->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                        'transaction_reference' => $trxRef,
                    ]);
                }

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => 'system',
                    'old_status' => 'pending',
                    'new_status' => 'confirmed',
                    'notes' => 'Pembayaran gateway terkonfirmasi sukses via Sandbox.',
                ]);
            } elseif ($status === 'failed' || $status === 'expired') {
                $order->update([
                    'payment_status' => $status,
                    'order_status' => 'cancelled',
                ]);

                if ($payment) {
                    $payment->update([
                        'payment_status' => $status,
                    ]);
                }

                // Restore stock when cancelled
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = \App\Models\Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock', $item->quantity);
                        }
                    }
                }

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => 'system',
                    'old_status' => 'pending',
                    'new_status' => 'cancelled',
                    'notes' => "Transaksi {$status} dari payment gateway.",
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Status pembayaran berhasil diperbarui menjadi {$status}.",
                'data' => [
                    'order_number' => $order->order_number,
                    'order_status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                ],
            ]);
        });
    }
}
