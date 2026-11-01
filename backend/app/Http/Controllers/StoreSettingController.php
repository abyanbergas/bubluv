<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use Illuminate\Http\Request;

class StoreSettingController extends Controller
{
    public function index()
    {
        $settings = StoreSetting::all()->pluck('setting_value', 'setting_key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }
}
