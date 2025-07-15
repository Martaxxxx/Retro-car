<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\LoginLog;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        Log::info('login() został wywołany');

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            Log::info('Próba zapisu logowania dla user_id: ' . $user->id);

            try {
                $log = LoginLog::create([
                    'user_id'    => $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->header('User-Agent'),
                ]);

                Log::info(' Zapisano logowanie do bazy, ID: ' . $log->id);
            } catch (\Exception $e) {
                Log::error(' Błąd przy zapisie logowania: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Zalogowano pomyślnie',
                'user'    => $user,
            ]);
        }

        Log::warning(' Nieudana próba logowania dla: ' . $request->input('email'));

        return response()->json([
            'message' => 'Nieprawidłowe dane logowania',
        ], 401);
    }
}
