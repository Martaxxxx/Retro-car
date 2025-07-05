<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    // 📦 Zwraca wszystkie projekty
    public function index()
    {
        $projects = Project::all();
        return response()->json($projects);
    }

    // 💾 Zapisuje nowy projekt
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|file|image|max:5120',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|string',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1885|max:' . date('Y'),
            'car_id' => 'required|string|max:100|unique:projects,car_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Nieprawidłowe dane.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 🧱 Tworzenie projektu bez zdjęcia (tymczasowo)
        $project = Project::create([
            'name' => $request->name,
            'image' => null,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => $request->status,
            'brand' => $request->brand,
            'model' => $request->model,
            'year' => $request->year,
            'car_id' => $request->car_id,
        ]);

        // 📸 Obsługa pliku obrazu – zapisz jako main.jpg w folderze projektu
        if ($request->hasFile('image')) {
            $path = $request->file('image')->storeAs("uploads/projects/project_{$project->id}", 'main.jpg', 'public');
            $project->image = "/storage/{$path}";
            $project->save();
        }

        return response()->json([
            'message' => 'Projekt został zapisany.',
            'project' => $project,
        ], 201);
    }

    // 🔍 Wyszukuje projekty na podstawie zapytania
    public function search(Request $request)
    {
        $query = $request->query('query');  

        if (!$query) {
            return response()->json(['message' => 'Brak zapytania wyszukiwania'], 400);
        }

        $queryLower = strtolower($query);

        $projects = Project::whereRaw('LOWER(name) LIKE ?', ['%' . $queryLower . '%'])
            ->orWhereRaw('LOWER(brand) LIKE ?', ['%' . $queryLower . '%'])
            ->orWhereRaw('LOWER(status) LIKE ?', ['%' . $queryLower . '%'])
            ->orWhereRaw('LOWER(model) LIKE ?', ['%' . $queryLower . '%'])
            ->orWhereRaw('LOWER(car_id) LIKE ?', ['%' . $queryLower . '%'])
            ->orWhereRaw('CAST(year AS CHAR) LIKE ?', ['%' . $queryLower . '%'])
            ->get();

        Log::info("Wyniki wyszukiwania dla zapytania [$query]:", $projects->toArray());

        return response()->json($projects);
    }

    // 🔍 Pokazuje projekt po ID i nazwie
    public function showByIdAndName($id, $name)
    {
        $decodedName = urldecode($name);
        Log::info("🔍 Szukanie projektu ID [$id] z nazwą [$decodedName]");

        $project = Project::where('id', $id)
            ->whereRaw('LOWER(name) = ?', [strtolower($decodedName)])
            ->first();

        if (!$project) {
            return response()->json(['message' => 'Projekt nie znaleziony.'], 404);
        }

        $project->assignedTo = ['Blacharz_Arek', 'Lakiernik_Kasia'];
        $project->parts = $project->parts()->get();
        $project->files = $project->files()->get();
        $project->description = 'Tutaj będzie opis projektu';

        return response()->json($project);
    }
}