<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RenovationController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\IsAdmin;

// 🏠 Widok SPA (React)
Route::get('/', function () {
    return view('app');
});

// 🔐 Logowanie – sesyjne
Route::post('/api/login', [AuthController::class, 'login']);

// 🔐 Dane zalogowanego użytkownika
Route::middleware(['web', 'auth'])->get('/api/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'roles' => [$user->role],
        'avatar' => $user->avatar ?? null,
        'created_at' => $user->created_at,
        'updated_at' => $user->updated_at,
    ]);
});

// ✅ Użytkownicy – tylko dla admina
Route::middleware(['auth', IsAdmin::class])->group(function () {
    Route::get('/api/users', [UserController::class, 'index']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::post('/api/users', [UserController::class, 'store']);
    Route::post('/register', [RegisterController::class, 'register']);
});

// 📁 Projekty – tylko po zalogowaniu
Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
});

// 📦 Renowacje – publiczne
Route::get('/renovations', [RenovationController::class, 'index']);

// Podstrona projektu ze slajdera
Route::get('/projectdetails/{name}', [ProjectController::class, 'showByName']);

// SPA fallback – wszystkie inne ścieżki do Reacta
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
