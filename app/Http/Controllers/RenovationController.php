<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class RenovationController extends Controller
{
    // Zwraca WSZYSTKIE projekty z tabeli 'projects'
    public function index()
    {
        return response()->json(Project::all());
    }

    // Dodaje nowy projekt do tabeli 'projects'
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

        return Project::create($validated);
    }

    // Pokazuje pojedynczy projekt
    public function show(Project $project)
    {
        return response()->json($project);
    }

    // Aktualizuje projekt
    public function update(Request $request, Project $project)
    {
        $project->update($request->all());
        return response()->json($project);
    }

    // Usuwa projekt
    public function destroy(Project $project)
    {
        $project->delete();
        return response()->noContent();
    }
}