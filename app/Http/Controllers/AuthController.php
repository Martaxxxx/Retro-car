<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            return response()->json([
                'message' => 'Zalogowano pomyślnie',
                'user' => $user,
            ]);
        }

        return response()->json([
            'message' => 'Nieprawidłowe dane logowania'
        ], 401);
    }
}
