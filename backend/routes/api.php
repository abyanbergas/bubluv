<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminCustomerController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminStoreSettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| BubLuv API Routes
|--------------------------------------------------------------------------
*/

// --- Public Endpoints ---
Route::get('/settings', [StoreSettingController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

// Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Order creation (supports authenticated customers and guests)
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
Route::post('/orders/{orderNumber}/proof', [OrderController::class, 'uploadPaymentProof']);

// Sandbox Simulation / Gateway Callback
Route::post('/payments/simulate-sandbox', [PaymentController::class, 'simulateSandbox']);

// --- Customer Authenticated Endpoints ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/customer/orders', [OrderController::class, 'customerOrders']);
});

// --- Admin Endpoints (Protected by Sanctum & Admin Middleware) ---
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard metrics
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // Product Management
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::get('/products/{id}', [AdminProductController::class, 'show']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::post('/products/{id}', [AdminProductController::class, 'update']); // Supports multipart/form-data
    Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);

    // Category Management
    Route::get('/categories', [AdminCategoryController::class, 'index']);
    Route::post('/categories', [AdminCategoryController::class, 'store']);
    Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

    // Payment Management
    Route::get('/payments', [AdminPaymentController::class, 'index']);
    Route::put('/payments/{id}/verify', [AdminPaymentController::class, 'verifyPayment']);

    // Customer Management
    Route::get('/customers', [AdminCustomerController::class, 'index']);

    // Store Settings
    Route::get('/settings', [AdminStoreSettingController::class, 'index']);
    Route::post('/settings', [AdminStoreSettingController::class, 'update']);
});
