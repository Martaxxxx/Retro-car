<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        // tylko zalogowany admin może tworzyć nowych użytkowników
        if (auth()->check() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Brak dostępu'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'in:user,admin', // lub bez tego, jeśli tylko "user"
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
        ]);

        return response()->json(['message' => 'Użytkownik zarejestrowany', 'user' => $user], 201);
    }
}
