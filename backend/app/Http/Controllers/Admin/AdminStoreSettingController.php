<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\Request;

class AdminStoreSettingController extends Controller
{
    public function index()
    {
        $settings = StoreSetting::all()->pluck('setting_value', 'setting_key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            StoreSetting::set($key, is_null($value) ? '' : (string) $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan toko berhasil disimpan.',
            'data' => StoreSetting::all()->pluck('setting_value', 'setting_key'),
        ]);
    }
}
