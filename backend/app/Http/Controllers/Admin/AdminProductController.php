<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'variants', 'images'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ingredients' => 'nullable|string',
            'serving_suggestion' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'weight' => 'required|integer|min:1',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_new_arrival' => 'boolean',
            'variants' => 'nullable|array',
            'variants.*.variant_name' => 'required_with:variants|string|max:100',
            'variants.*.price_adjustment' => 'nullable|numeric',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.sku' => 'nullable|string|max:100',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $stored = $request->file('image')->store('products', 'public');
                $imagePath = '/storage/' . $stored;
            }

            // Generate unique slug
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Product::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'ingredients' => $validated['ingredients'] ?? null,
                'serving_suggestion' => $validated['serving_suggestion'] ?? null,
                'price' => $validated['price'],
                'sale_price' => $validated['sale_price'] ?? null,
                'stock' => $validated['stock'],
                'sku' => $validated['sku'] ?? null,
                'weight' => $validated['weight'],
                'image' => $imagePath,
                'is_active' => $request->boolean('is_active', true),
                'is_featured' => $request->boolean('is_featured', false),
                'is_best_seller' => $request->boolean('is_best_seller', false),
                'is_new_arrival' => $request->boolean('is_new_arrival', false),
            ]);

            if (!empty($validated['variants'])) {
                foreach ($validated['variants'] as $v) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_name' => $v['variant_name'],
                        'price_adjustment' => $v['price_adjustment'] ?? 0,
                        'stock' => $v['stock'] ?? 0,
                        'sku' => $v['sku'] ?? null,
                        'is_active' => true,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan.',
                'data' => $product->load(['category', 'variants']),
            ], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ingredients' => 'nullable|string',
            'serving_suggestion' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'weight' => 'required|integer|min:1',
            'image' => 'nullable',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_new_arrival' => 'boolean',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable',
            'variants.*.variant_name' => 'required_with:variants|string|max:100',
            'variants.*.price_adjustment' => 'nullable|numeric',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.sku' => 'nullable|string|max:100',
        ]);

        return DB::transaction(function () use ($request, $product, $validated) {
            if ($request->hasFile('image')) {
                $stored = $request->file('image')->store('products', 'public');
                $product->image = '/storage/' . $stored;
            }

            $product->update([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'ingredients' => $validated['ingredients'] ?? null,
                'serving_suggestion' => $validated['serving_suggestion'] ?? null,
                'price' => $validated['price'],
                'sale_price' => $validated['sale_price'] ?? null,
                'stock' => $validated['stock'],
                'sku' => $validated['sku'] ?? null,
                'weight' => $validated['weight'],
                'is_active' => $request->boolean('is_active', true),
                'is_featured' => $request->boolean('is_featured', false),
                'is_best_seller' => $request->boolean('is_best_seller', false),
                'is_new_arrival' => $request->boolean('is_new_arrival', false),
            ]);

            // Sync variants if provided
            if (isset($validated['variants'])) {
                $existingIds = [];
                foreach ($validated['variants'] as $v) {
                    if (!empty($v['id'])) {
                        $variant = ProductVariant::where('id', $v['id'])
                            ->where('product_id', $product->id)
                            ->first();

                        if ($variant) {
                            $variant->update([
                                'variant_name' => $v['variant_name'],
                                'price_adjustment' => $v['price_adjustment'] ?? 0,
                                'stock' => $v['stock'] ?? 0,
                                'sku' => $v['sku'] ?? null,
                            ]);
                            $existingIds[] = $variant->id;
                        }
                    } else {
                        $newVariant = ProductVariant::create([
                            'product_id' => $product->id,
                            'variant_name' => $v['variant_name'],
                            'price_adjustment' => $v['price_adjustment'] ?? 0,
                            'stock' => $v['stock'] ?? 0,
                            'sku' => $v['sku'] ?? null,
                            'is_active' => true,
                        ]);
                        $existingIds[] = $newVariant->id;
                    }
                }

                // Delete removed variants
                ProductVariant::where('product_id', $product->id)
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diperbarui.',
                'data' => $product->fresh(['category', 'variants']),
            ]);
        });
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}
