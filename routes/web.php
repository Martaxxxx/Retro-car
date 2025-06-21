<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RenovationController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ShoppingListController;
use App\Http\Controllers\NotificationController;


// 🏠 Widok SPA (Vue/React)
Route::get('/', function () {
    return view('app');
});

// 🔐 Logowanie (sesyjne + CSRF)
Route::post('/api/login', [AuthController::class, 'login']);

// 🔐 Dane zalogowanego użytkownika (z sesji)
Route::middleware(['web', 'auth'])->get('/api/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'roles' => [$user->role], // zawsze tablica
        'avatar' => $user->avatar ?? null,
        'created_at' => $user->created_at,
        'updated_at' => $user->updated_at,
    ]);
});

// 🔐 Rejestracja – tylko dla adminów
Route::middleware(['auth', 'is_admin'])->post('/register', [RegisterController::class, 'register']);

// 📁 Projekty – dostępne tylko po zalogowaniu
Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
});

// 📦 Renowacje (jeśli mają być publiczne – bez auth)
Route::get('/renovations', [RenovationController::class, 'index']);
//podstrona projektu ze slajdera
// BĘDZIE TAK:
Route::get('/api/projectdetails/{id}/{name}', [ProjectController::class, 'showByIdAndName']);




Route::get('/projects/{project}/parts', [PartController::class, 'index']);
Route::post('/projects/{project}/parts', [PartController::class, 'store']);
Route::put('/parts/{part}', [PartController::class, 'update']);
Route::delete('/parts/{part}', [PartController::class, 'destroy']);

Route::middleware('auth')->group(function () {
    Route::get('/projects/{project}/shopping-items', [ShoppingListController::class, 'index']);
    Route::post('/projects/{project}/shopping-items', [ShoppingListController::class, 'store']);
    Route::put('/shopping-items/{id}', [ShoppingListController::class, 'update']);
    Route::delete('/shopping-items/{id}', [ShoppingListController::class, 'destroy']);
});

Route::get('/notifications/{userId}', [NotificationController::class, 'index']);
Route::post('/notifications/{userId}/mark-read', [NotificationController::class, 'markAllAsRead']);

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

