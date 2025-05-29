<?php

namespace App\Http\Controllers;

use App\Models\Renovation;
use Illuminate\Http\Request;

class RenovationController extends Controller
{
    public function index()
    {
        return Renovation::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'brand' => 'required|string',
            'year' => 'required|integer',
            'status' => 'required|string',
            'image' => 'nullable|string',
            'end_date' => 'nullable|date',
            'user_id' => 'required|exists:users,id'
        ]);

        return Renovation::create($validated);
    }

    public function show(Renovation $renovation)
    {
        return $renovation;
    }

    public function update(Request $request, Renovation $renovation)
    {
        $renovation->update($request->all());
        return $renovation;
    }

    public function destroy(Renovation $renovation)
    {
        $renovation->delete();
        return response()->noContent();
    }
}

