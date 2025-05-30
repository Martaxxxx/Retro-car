<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('app');
});

// 🔐 Logowanie (musi być w web.php dla sesji i CSRF)
Route::post('/api/login', [AuthController::class, 'login']);

// 🔐 Dane zalogowanego użytkownika (z sesji)
Route::middleware(['web', 'auth'])->get('/api/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'roles' => [$user->role], // zawsze jako tablica
        'avatar' => $user->avatar ?? null,
        'created_at' => $user->created_at,
        'updated_at' => $user->updated_at,
    ]);
});
