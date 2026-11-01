<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminPaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('order');

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function verifyPayment(Request $request, $id)
    {
        $payment = Payment::with('order')->findOrFail($id);

        $validated = $request->validate([
            'action' => 'required|in:approve,reject,collect_cod',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($payment, $validated) {
            $order = $payment->order;
            $action = $validated['action'];
            $notes = $validated['notes'];

            if ($action === 'approve') {
                $payment->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                $order->update([
                    'payment_status' => 'paid',
                    'order_status' => ($order->order_status === 'pending') ? 'confirmed' : $order->order_status,
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => 'admin',
                    'old_status' => $order->order_status,
                    'new_status' => $order->order_status,
                    'notes' => $notes ?: 'Bukti transfer berhasil diverifikasi oleh Admin. Pembayaran dinyatakan SAH.',
                ]);

                $message = 'Pembayaran transfer bank berhasil diverifikasi dan disetujui.';
            } elseif ($action === 'collect_cod') {
                $payment->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                $order->update([
                    'payment_status' => 'paid',
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => 'admin',
                    'old_status' => $order->order_status,
                    'new_status' => $order->order_status,
                    'notes' => $notes ?: 'Pembayaran tunai di tempat (COD) telah berhasil diterima/dikumpulkan.',
                ]);

                $message = 'Pembayaran COD berhasil ditandai sebagai telah diterima.';
            } else { // reject
                $payment->update([
                    'payment_status' => 'failed',
                ]);

                $order->update([
                    'payment_status' => 'failed',
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'changed_by' => 'admin',
                    'old_status' => $order->order_status,
                    'new_status' => $order->order_status,
                    'notes' => $notes ?: 'Bukti pembayaran ditolak oleh Admin karena data tidak sesuai.',
                ]);

                $message = 'Bukti pembayaran ditolak.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $payment->fresh('order'),
            ]);
        });
    }
}
