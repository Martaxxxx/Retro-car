<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class ProjectController extends Controller
{
    // odpowiada za to kto widzi projekty- wszyscy

    public function index()
    {
        // Eager load parts, bo progressPercent korzysta z parts
        $projects = Project::with(['users:id,name,surname', 'shoppingItems', 'parts'])->get();

        // Każdy projekt zamieniamy na tablicę, żeby dodać progressPercent w odpowiedzi
        $projectsArray = $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'name' => $project->name,
                'image' => $project->image,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'status' => $project->status,
                'brand' => $project->brand,
                'model' => $project->model,
                'year' => $project->year,
                'car_id' => $project->car_id,
                'users' => $project->users,
                'shoppingItems' => $project->shoppingItems,
                'parts' => $project->parts,
                'progressPercent' => $project->progress_percent, 
            ];
        });

        return response()->json($projectsArray);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'image'      => 'nullable|file|image|max:5120',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'status'     => 'required|string',
            'brand'      => 'nullable|string|max:100',
            'model'      => 'nullable|string|max:100',
            'year'       => 'nullable|integer|min:1885|max:' . date('Y'),
            'car_id'     => 'nullable|string|max:100|unique:projects,car_id',
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Nieprawidłowe dane.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $project = Project::create([
            'name'       => $request->name,
            'image'      => null,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'status'     => $request->status,
            'brand'      => $request->brand,
            'model'      => $request->model,
            'year'       => $request->year,
            'car_id'     => $request->car_id,
        ]);

        if ($request->has('user_ids')) {
            $project->users()->sync($request->user_ids);

            if (count($request->user_ids)) {
                $notification = Notification::create([
                    'project_id' => $project->id,
                    'sender_id' => auth()->id() ?? $request->user()->id ?? 1, 
                    'text' => 'Zostałeś dodany do projektu: ' . $project->name,
                ]);
                $notification->users()->attach($request->user_ids, ['read' => false]);
            }
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->storeAs(
                "uploads/projects/project_{$project->id}",
                'main.jpg',
                'public'
            );

            $project->image = "/storage/{$path}";
            $project->save();
        }

        $project->load('users');

        return response()->json([
            'message' => 'Projekt został zapisany.',
            'project' => $project,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'status'     => 'required|string',
            'brand'      => 'nullable|string|max:100',
            'model'      => 'nullable|string|max:100',
            'year'       => 'nullable|integer|min:1885|max:' . date('Y'),
            'car_id'     => 'nullable|string|max:100',
            'description'=> 'nullable|string',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Nieprawidłowe dane.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $project->name        = $request->name;
        $project->status      = $request->status;
        $project->brand       = $request->brand;
        $project->model       = $request->model;
        $project->year        = $request->year;
        $project->car_id      = $request->car_id;
        $project->description = $request->description;
        $project->start_date  = $request->start_date;
        $project->end_date    = $request->end_date;
        $project->save();

        if ($request->has('user_ids')) {
            $project->users()->sync($request->user_ids);
        }

        $project->load('users');

        return response()->json([
            'message' => 'Projekt został zaktualizowany.',
            'project' => $project,
        ]);
    }

    public function destroy($id)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['message' => 'Projekt nie znaleziony.'], 404);
        }

        //  Usuń folder uploads/projects/project_{id}
        $folderPath = storage_path("app/public/uploads/projects/project_{$id}");
        if (File::exists($folderPath)) {
            File::deleteDirectory($folderPath);
        }

        $project->delete();

        return response()->json(['message' => 'Projekt został usunięty.']);
    }

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

    public function showByIdAndName($id, $name)
    {
        $decodedName = urldecode($name);

        Log::info("Szukanie projektu ID [$id] z nazwą [$decodedName]");

        $project = Project::where('id', $id)
            ->whereRaw('LOWER(name) = ?', [strtolower($decodedName)])
            ->first();

        if (!$project) {
            return response()->json(['message' => 'Projekt nie znaleziony.'], 404);
        }

        $project->load('users');
        $project->parts       = $project->parts()->get();
        $project->files       = $project->files()->get();
        $project->description = 'Tutaj będzie opis projektu';

        return response()->json($project);
    }
}