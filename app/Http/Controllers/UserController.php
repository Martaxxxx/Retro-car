<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::select('id', 'name', 'surname', 'email', 'login', 'role', 'avatar', 'created_at')->get();
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
            'surname' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'login' => 'nullable|string|max:255|unique:users,login',
            'role' => 'required|string|in:admin,manager,user,purchaser',
            'password' => 'required|string|min:6',
            'avatar' => 'nullable|image|max:2048',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = '/storage/' . $request->file('avatar')->store('avatars', 'public');
        }

        $user = User::create([
            'name' => $validated['name'],
            'surname' => $request->input('surname'),
            'email' => $validated['email'],
            'login' => $request->input('login'),
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'avatar' => $avatarPath,
        ]);

        return response()->json(['message' => 'Użytkownik utworzony', 'user' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'nullable|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'login' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|string|in:admin,manager,user,purchaser',
            'avatar' => 'nullable|image|max:2048',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $validated['name'];
        $user->surname = $request->input('surname');
        $user->email = $validated['email'];
        $user->login = $request->input('login');
        $user->role = $validated['role'];

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = '/storage/' . $path;
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Użytkownik zaktualizowany']);
    }
}