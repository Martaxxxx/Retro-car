<?php

namespace App\Http\Controllers;

use App\Models\Part;
use App\Models\Project;
use Illuminate\Http\Request;

class PartController extends Controller
{
    // Pobierz WSZYSTKIE części danego projektu
    public function index($projectId)
    {
        return Part::where('project_id', $projectId)->get();
    }

    // Dodaj NOWĄ część do projektu
    public function store(Request $request, $projectId)
    {
        $data = $request->validate([
            'part_code' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,ready,installed',
        ]);

        $project = Project::findOrFail($projectId);
        $data['project_id'] = $projectId;

        // Generujemy treść QR
        $data['qr_code_data'] = "{$project->name}, {$data['part_code']}, {$data['name']}";

        $part = Part::create($data);
        return response()->json($part, 201);
    }

    // EDYTUJ istniejącą część
    public function update(Request $request, $id)
    {
        $part = Part::findOrFail($id);

        $data = $request->validate([
            'part_code' => 'sometimes|required|string|max:255',
            'name' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|required|in:pending,ready,installed',
        ]);

        $part->update($data);

        // Jeśli zmienił się part_code lub name – aktualizuj QR code
        if (isset($data['part_code']) || isset($data['name'])) {
            $project = $part->project; // dzięki relacji belongsTo
            $part->qr_code_data = "{$project->name}, {$part->part_code}, {$part->name}";
            $part->save();
        }

        return response()->json($part);
    }

    // USUŃ część
    public function destroy($id)
    {
        $part = Part::findOrFail($id);
        $part->delete();

        return response()->json(['success' => true]);
    }
}
