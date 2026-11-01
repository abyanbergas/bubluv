<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'ingredients',
        'serving_suggestion',
        'price',
        'sale_price',
        'stock',
        'sku',
        'weight',
        'image',
        'is_active',
        'is_featured',
        'is_best_seller',
        'is_new_arrival',
    ];

    protected $casts = [
        'price' => 'float',
        'sale_price' => 'float',
        'stock' => 'integer',
        'weight' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_best_seller' => 'boolean',
        'is_new_arrival' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function activeVariants()
    {
        return $this->hasMany(ProductVariant::class)->where('is_active', true);
    }

    public function getEffectivePriceAttribute()
    {
        return ($this->sale_price !== null && $this->sale_price > 0 && $this->sale_price < $this->price)
            ? $this->sale_price
            : $this->price;
    }
}
