<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    // ZWRACA WSZYSTKIE PROJEKTY
    public function index()
    {
        $projects = Project::all();
        return response()->json($projects);
    }

    // ZAPISUJE NOWY PROJEKT
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|file|image|max:5120', // zmiana: obsługa pliku
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|string',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1885|max:' . date('Y'),
            'car_id' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Nieprawidłowe dane.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Obsługa pliku zdjęcia
        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('uploads', 'public');
            $imagePath = '/storage/' . $path;
        }

        $project = Project::create([
            'name' => $request->name,
            'image' => $imagePath,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => $request->status,
            'brand' => $request->brand,
            'model' => $request->model,
            'year' => $request->year,
            'car_id' => $request->car_id,
        ]);

        return response()->json([
            'message' => 'Projekt został zapisany.',
            'project' => $project,
        ], 201);
    }

    // ✅ ZWRACA PROJEKT NA PODSTAWIE NAZWY
    public function showByName($name)
    {
        $project = Project::where('name', $name)->first();
    
        if (!$project) {
            return response()->json(['message' => 'Projekt nie znaleziony.'], 404);
        }
    
        // Dodaj dane tymczasowe, dopiero po sprawdzeniu że projekt istnieje
        $project->assignedTo = ['Blacharz_Arek', 'Lakiernik_Kasia'];
        $project->parts = [];
        $project->description = 'Tutaj będzie opis projektu';
    
        return response()->json($project);
    }
}    