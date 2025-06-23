<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RenovationController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ShoppingListController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserSettingsController;

// Widok SPA (React/Vite)
Route::get('/', function () {
    return view('app');
});

// Logowanie
Route::post('/api/login', [AuthController::class, 'login']);

// Dane zalogowanego użytkownika
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

// Rejestracja (tylko dla adminów)
Route::middleware(['auth', 'is_admin'])->post('/register', [RegisterController::class, 'register']);

// Projekty (z auth)
Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);

    Route::get('/projects/{project}/shopping-items', [ShoppingListController::class, 'index']);
    Route::post('/projects/{project}/shopping-items', [ShoppingListController::class, 'store']);
    Route::put('/shopping-items/{id}', [ShoppingListController::class, 'update']);
    Route::delete('/shopping-items/{id}', [ShoppingListController::class, 'destroy']);
});

// Renowacje – publiczne
Route::get('/renovations', [RenovationController::class, 'index']);

// Szczegóły projektu (np. z kliknięcia w slajder)
Route::get('/api/projectdetails/{id}/{name}', [ProjectController::class, 'showByIdAndName']);

// Części – dostęp bez auth
Route::get('/projects/{project}/parts', [PartController::class, 'index']);
Route::post('/projects/{project}/parts', [PartController::class, 'store']);
Route::put('/parts/{part}', [PartController::class, 'update']);
Route::delete('/parts/{part}', [PartController::class, 'destroy']);

//  Powiadomienia 
Route::middleware('api')->group(function () {
    Route::get('/notifications/{userId}', [NotificationController::class, 'index']);
    Route::post('/notifications/{userId}/mark-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{userId}/mark-single-read', [NotificationController::class, 'markSingleAsRead']);
});



Route::middleware('auth')->post('/user/settings', [UserSettingsController::class, 'update']);


Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
