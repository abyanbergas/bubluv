<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'changed_by',
        'old_status',
        'new_status',
        'notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
