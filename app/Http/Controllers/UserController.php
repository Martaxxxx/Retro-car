<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::select('id', 'name', 'surname', 'email', 'role', 'avatar', 'created_at')->get();
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Błąd pobierania użytkowników',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string|in:admin,manager,user,purchaser',
            'password' => 'required|string|min:6',
            'avatar' => 'nullable|image|max:2048',
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->surname = $validated['surname'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->password = Hash::make($validated['password']);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('uploads/avatars', 'public');
            $user->avatar = '/storage/' . $path;
        }

        $user->save();

        return response()->json(['message' => 'Użytkownik utworzony', 'user' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|string|in:admin,manager,user,purchaser',
            'avatar' => 'nullable|image|max:8000',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $validated['name'];
        $user->surname = $validated['surname'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('uploads/avatars', 'public');
            $user->avatar = '/storage/' . $path;
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Użytkownik zaktualizowany']);
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return response()->json(['message' => 'Użytkownik usunięty']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Błąd usuwania użytkownika',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Zwraca historię logowań danego użytkownika.
     */
    public function loginLogs(Request $request, $id)
    {
        $perPage = 25;
        $query = \App\Models\LoginLog::where('user_id', $id)->orderBy('created_at', 'desc');
    
        // Filtrowanie po dacie (zakres)
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }
    
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }
    
        $logs = $query->paginate($perPage);
    
        return response()->json($logs);
    }
    
}