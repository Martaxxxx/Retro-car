<?php

use App\Http\Controllers\RenovationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;


// Zwraca zalogowanego użytkownika
Route::middleware('api')->get('/user', function (Request $request) {
    return $request->user();
});

// Twoja trasa API do renowacji
Route::get('/renovations', [RenovationController::class, 'index']);
// trasa logowanie
Route::post('/login', [AuthController::class, 'login']);
Route::middleware(['auth', 'is_admin'])->post('/register', [RegisterController::class, 'register']);
Route::middleware('web')->post('/login', [AuthController::class, 'login']);


