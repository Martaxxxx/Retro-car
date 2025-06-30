<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserSettingsController extends Controller
{
    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'avatar' => 'nullable|file|image|max:2048', // max 2MB
            'name' => 'nullable|string|max:255',
            'surname' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'login' => 'nullable|string|max:255|unique:users,login,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        // 📸 Obsługa avatara (jeśli przesłano plik)
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('uploads/avatars', 'public');
            $user->avatar = '/storage/' . $path;
        }

        if ($request->filled('name')) {
            $user->name = $request->name;
        }

        if ($request->filled('surname')) {
            $user->surname = $request->surname;
        }

        if ($request->filled('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('login')) {
            $user->login = $request->login;
        }

        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['error' => 'Bieżące hasło jest nieprawidłowe.'], 403);
            }
            $user->password = bcrypt($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Dane użytkownika zostały zaktualizowane.',
            'user' => $user,
        ]);
    }
}
