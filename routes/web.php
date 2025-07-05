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
use App\Http\Middleware\IsAdmin;

// SPA główna strona
Route::get('/', function () {
    return view('app');
});

//  Logowanie
Route::post('/api/login', [AuthController::class, 'login']);

//  Dane zalogowanego użytkownika (zawsze jako tablica ról)
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

//  Panel administracyjny – tylko admin
Route::middleware(['auth', IsAdmin::class])->group(function () {
    Route::get('/api/users', [UserController::class, 'index']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::post('/api/users', [UserController::class, 'store']);
    Route::post('/register', [RegisterController::class, 'register']);
    // Usuwanie użytkownika w adminpanelu
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    // Logi użytkownika
    Route::get('/api/users/{id}/logs', [UserController::class, 'loginLogs']);
});

//  Panel użytkownika – dla każdego zalogowanego
Route::middleware(['auth'])->post('/user/settings', [UserSettingsController::class, 'update']);

//  Projekty – dostęp tylko po zalogowaniu
Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);

    Route::get('/projects/{project}/shopping-items', [ShoppingListController::class, 'index']);
    Route::post('/projects/{project}/shopping-items', [ShoppingListController::class, 'store']);
    Route::put('/shopping-items/{id}', [ShoppingListController::class, 'update']);
    Route::delete('/shopping-items/{id}', [ShoppingListController::class, 'destroy']);
  
    // Usuwanie jednego załącznika (pliku) z itemu:
    Route::delete('/shopping-items/files/{id}', [ShoppingListController::class, 'deleteInvoice']);

    // "Moje pliki" – upload i zarządzanie plikami w projektach
    Route::get('/projects/{project}/files', [\App\Http\Controllers\ProjectFileController::class, 'index']);
    Route::post('/projects/{project}/files', [\App\Http\Controllers\ProjectFileController::class, 'store']);
    Route::delete('/projects/files/{id}', [\App\Http\Controllers\ProjectFileController::class, 'destroy']);
});

//  Części – brak auth
Route::get('/projects/{project}/parts', [PartController::class, 'index']);
Route::post('/projects/{project}/parts', [PartController::class, 'store']);
Route::put('/parts/{part}', [PartController::class, 'update']);
Route::delete('/parts/{part}', [PartController::class, 'destroy']);

//  Powiadomienia – API
Route::middleware('api')->group(function () {
    Route::get('/notifications/{userId}', [NotificationController::class, 'index']);
    Route::post('/notifications/{userId}/mark-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{userId}/mark-single-read', [NotificationController::class, 'markSingleAsRead']);
});

//  Renowacje – publiczne
Route::get('/renovations', [RenovationController::class, 'index']);

//  Szczegóły projektu
Route::get('/api/projectdetails/{id}/{name}', [ProjectController::class, 'showByIdAndName']);
Route::get('/projectdetails/{name}', [ProjectController::class, 'showByName']); // dla slajdera

// Trasa diagnostyczna 
Route::get('/check-db-path', function () {
    return DB::connection()->getDatabaseName();
});
Route::get('/projects/search', [ProjectController::class, 'search']);


// RAPORTY – DLA ZALOGOWANYCH 
Route::middleware(['auth'])->group(function () {
    Route::post('/reports/costs-data', [ReportController::class, 'costsData']);
    Route::post('/reports/progress-data', [ReportController::class, 'progressData']);
});

// SPA fallback – React (wszystko inne)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');