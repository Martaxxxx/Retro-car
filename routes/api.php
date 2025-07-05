<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\RenovationController;
use App\Http\Controllers\Auth\RegisterController;


// ✅ Trasy API — dostępne tylko po autoryzacji
Route::middleware(['auth', 'is_admin'])->post('/register', [RegisterController::class, 'register']);
Route::get('/renovations', [RenovationController::class, 'index']);
