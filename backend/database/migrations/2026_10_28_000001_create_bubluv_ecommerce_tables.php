<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('ingredients')->nullable();
            $table->text('serving_suggestion')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->string('sku')->nullable();
            $table->integer('weight')->default(500); // grams
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_best_seller')->default(false);
            $table->boolean('is_new_arrival')->default(false);
            $table->timestamps();

            $table->index(['is_active', 'category_id']);
            $table->index('price');
        });

        // 3. Product Images
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 4. Product Variants (e.g. 500g vs 1kg, or Plain vs Sweetened)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('variant_name');
            $table->string('sku')->nullable();
            $table->decimal('price_adjustment', 12, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 5. Carts
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->timestamps();
        });

        // 6. Cart Items
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // 7. Customer Addresses
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('address_line');
            $table->string('province');
            $table->string('city');
            $table->string('district');
            $table->string('postal_code');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // 8. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_number')->unique();
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('shipping_address');
            $table->string('shipping_method')->default('Reguler (2-3 Hari)');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('payment_method'); // manual_transfer, gateway_qris, gateway_ewallet, gateway_va, cod
            $table->string('payment_status')->default('unpaid'); // unpaid, pending_verification, paid, failed, expired, refunded
            $table->string('order_status')->default('pending'); // pending, confirmed, processing, shipped, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('order_status');
            $table->index('payment_status');
            $table->index('created_at');
        });

        // 9. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_name')->nullable();
            $table->string('sku')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        // 10. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // manual, midtrans_sandbox, cod
            $table->string('payment_method');
            $table->decimal('amount', 12, 2);
            $table->string('transaction_reference')->nullable();
            $table->string('payment_status')->default('unpaid');
            $table->string('payment_proof')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // 11. Order Status Histories
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('changed_by')->default('system'); // customer, admin, system
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 12. Store Settings
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_settings');
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
