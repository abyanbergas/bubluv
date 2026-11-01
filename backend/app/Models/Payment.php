<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'provider',
        'payment_method',
        'amount',
        'transaction_reference',
        'payment_status',
        'payment_proof',
        'paid_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
