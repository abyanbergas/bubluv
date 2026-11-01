<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BubluvEcommerceTest extends TestCase
{
    public function test_public_can_fetch_categories_and_products(): void
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);

        $prodResponse = $this->getJson('/api/products');
        $prodResponse->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_customer_can_register_and_receive_token(): void
    {
        $uniqueEmail = 'testuser_' . time() . '@example.com';
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Budi Santoso',
            'email' => $uniqueEmail,
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'phone' => '08111222333',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'customer');

        $this->assertDatabaseHas('users', [
            'email' => $uniqueEmail,
            'role' => 'customer',
        ]);
    }

    public function test_unauthorized_user_cannot_access_admin_endpoints(): void
    {
        $customer = User::where('role', 'customer')->first();
        if (!$customer) {
            $customer = User::create([
                'name' => 'Customer Test',
                'email' => 'cust@test.com',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ]);
        }

        // Test without auth
        $this->getJson('/api/admin/dashboard')->assertStatus(401);

        // Test with customer auth
        $this->actingAs($customer)
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_checkout_validates_stock_and_creates_order(): void
    {
        $product = Product::where('is_active', true)->where('stock', '>', 5)->first();
        $this->assertNotNull($product, 'Must have at least one active product in stock');

        $orderPayload = [
            'recipient_name' => 'Tester Bubluv',
            'phone' => '081299998888',
            'shipping_address' => 'Jl. Boulevard No. 1, Jakarta',
            'shipping_method' => 'Reguler',
            'shipping_cost' => 15000,
            'payment_method' => 'manual_transfer',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ]
            ]
        ];

        $stockBefore = $product->stock;

        $response = $this->postJson('/api/orders', $orderPayload);
        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        // Verify stock decreased
        $product->refresh();
        $this->assertEquals($stockBefore - 2, $product->stock);

        $orderNumber = $response->json('data.order_number');
        $this->assertDatabaseHas('orders', [
            'order_number' => $orderNumber,
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_payment_sandbox_simulation_updates_status(): void
    {
        $product = Product::where('is_active', true)->first();

        $createResponse = $this->postJson('/api/orders', [
            'recipient_name' => 'Tester Gateway',
            'phone' => '081299998888',
            'shipping_address' => 'Jl. Test No. 2, Bandung',
            'shipping_method' => 'Reguler',
            'shipping_cost' => 10000,
            'payment_method' => 'gateway_qris',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ]
            ]
        ]);

        $orderNumber = $createResponse->json('data.order_number');

        $simResponse = $this->postJson('/api/payments/simulate-sandbox', [
            'order_number' => $orderNumber,
            'status' => 'settlement',
            'transaction_reference' => 'TEST-SIM-12345',
        ]);

        $simResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('orders', [
            'order_number' => $orderNumber,
            'payment_status' => 'paid',
            'order_status' => 'confirmed',
        ]);
    }
}
