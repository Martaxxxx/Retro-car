<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RenovationController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ShoppingListController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserSettingsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProjectFileController;

use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsManager;
use App\Http\Middleware\IsPurchaser;
use Illuminate\Support\Facades\Auth;

// SPA główna strona
Route::get('/', fn() => view('app'));

// Logowanie
Route::post('/api/login', [AuthController::class, 'login']);

// Dane zalogowanego użytkownika
Route::middleware(['web', 'auth'])->get('/api/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'surname' => $user->surname,
        'email' => $user->email,
        'roles' => [$user->role],
        'avatar' => $user->avatar ?? null,
        'created_at' => $user->created_at,
        'updated_at' => $user->updated_at,
    ]);
});

// Panel administracyjny – tylko admin
Route::middleware(['auth', IsAdmin::class])->group(function () {
    Route::get('/admin', fn() => view('app'));
});

// Projekty i renowacje – widoczne dla KAŻDEGO zalogowanego użytkownika
Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/renovations', [ProjectController::class, 'index']);

    // Pliki – dostępne dla każdego zalogowanego użytkownika!
    Route::get('/projects/{project}/files', [ProjectFileController::class, 'index']);
    Route::post('/projects/{project}/files', [ProjectFileController::class, 'store']);
    Route::delete('/projects/files/{id}', [ProjectFileController::class, 'destroy']);

    // Ustawienia użytkownika
    Route::post('/user/settings', [UserSettingsController::class, 'update']);

    // Lista zakupowa (shopping-items) – dostęp dla wszystkich ról (user, manager, admin, purchaser)
    Route::get('/projects/{project}/shopping-items', [ShoppingListController::class, 'index']);
    Route::post('/projects/{project}/shopping-items', [ShoppingListController::class, 'store']);
    Route::put('/shopping-items/{id}', [ShoppingListController::class, 'update']);
    Route::delete('/shopping-items/{id}', [ShoppingListController::class, 'destroy']);
    Route::delete('/shopping-items/files/{id}', [ShoppingListController::class, 'deleteInvoice']);
});

// Projekty i zarządzanie – tylko admin + manager
Route::middleware(['auth', IsManager::class])->group(function () {
    // Użytkownicy
    Route::get('/api/users', [UserController::class, 'index']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::post('/api/users', [UserController::class, 'store']);
    Route::post('/register', [RegisterController::class, 'register']);
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::get('/api/users/{id}/logs', [UserController::class, 'loginLogs']);

    // Projekty (zarządzanie)
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

    // Raporty
    Route::post('/reports/costs-data', [ReportController::class, 'costsData']);
    Route::post('/reports/progress-data', [ReportController::class, 'progressData']);
});

// Części – tylko dla user, manager, admin (NIE dla purchaser)
Route::middleware(['auth',])->group(function () {
    Route::get('/projects/{project}/parts', [PartController::class, 'index']);
    Route::post('/projects/{project}/parts', [PartController::class, 'store']);
    Route::put('/parts/{part}', [PartController::class, 'update']);
    Route::delete('/parts/{part}', [PartController::class, 'destroy']);
});

// Powiadomienia – jako API (prefix /api)
Route::prefix('api')->group(function () {
    Route::get('/notifications/{userId}', [NotificationController::class, 'index']);
    Route::post('/notifications/{userId}/mark-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{userId}/mark-single-read', [NotificationController::class, 'markSingleAsRead']);

    // Powiadomienia zakupowca – tylko dla purchaserów
    Route::middleware('ispurchaser')->get('/purchaser-notifications/{userId}', [ShoppingListController::class, 'purchaserNotifications']);
});

// SZCZEGÓŁY PROJEKTU – preferowany format: /projectdetails/{id}/{brand}/{model}
// Dla adresów typu /projectdetails/32/Mercedes/W124
Route::get('/projectdetails/{id}/{brand}/{model}', [ProjectController::class, 'showByIdBrandModel']);

// Legacy/tradycyjny: /api/projectdetails/{id}/{name} (opcjonalnie, można usunąć jeśli niepotrzebne)
Route::get('/api/projectdetails/{id}/{name}', [ProjectController::class, 'showByIdAndName']);

// Trasa diagnostyczna
Route::get('/check-db-path', fn() => DB::connection()->getDatabaseName());

// Wyszukiwanie projektów – dostępne dla każdego
Route::get('/projects/search', [ProjectController::class, 'search']);

// SPA fallback – wszystko inne do Reacta
Route::get('/{any}', fn() => view('app'))->where('any', '.*');


Route::post('/api/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Wylogowano']);
});