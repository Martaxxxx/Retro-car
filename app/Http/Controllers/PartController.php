<?php

namespace App\Http\Controllers;

use App\Models\Part;
use App\Models\Project;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class PartController extends Controller
{
    protected $statusTranslations = [
        'pending' => 'W przygotowaniu',
        'ready' => 'Gotowy do montażu',
        'installed' => 'Zamontowany',
    ];

    protected $statusEmojis = [
        'pending' => '',
        'ready' => '',
        'installed' => '',
    ];

    public function index($projectId)
    {
        return Part::where('project_id', $projectId)->get();
    }

    public function store(Request $request, $projectId)
    {
        $data = $request->validate([
            'part_code' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,ready,installed',
        ]);

        $data['notes'] = $data['notes'] ?? '';

        $project = Project::findOrFail($projectId);
        $data['project_id'] = $projectId;
        $data['qr_code_data'] = "{$project->name}, {$data['part_code']}, {$data['name']}";

        $part = Part::create($data);

        $user = auth()->user();
        $admins = User::where('role', 'admin')->get();

        $translatedStatus = $this->statusTranslations[$data['status']] ?? $data['status'];

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'text' => " {$user->name} dodał część '{$part->name}' (status: {$translatedStatus}) do projektu '{$project->name}'",
                'read' => false,
            ]);
        }

        return response()->json($part, 201);
    }

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

    $data['notes'] = $data['notes'] ?? '';

    $originalStatus = $part->status;
    $newStatus = $data['status'] ?? $originalStatus;
    $statusChanged = $newStatus !== $originalStatus;

    $part->fill($data);

    $project = $part->project;
    if (!$project) {
        return response()->json(['error' => 'Projekt nie istnieje'], 404);
    }

    if (isset($data['part_code']) || isset($data['name'])) {
        $part->qr_code_data = "{$project->name}, {$part->part_code}, {$part->name}";
    }

    $changes = $part->getDirty(); // tylko to co się faktycznie zmieniło
    $part->save();

    $user = auth()->user();
    $admins = User::where('role', 'admin')->get();

    if (!empty($changes)) {
        $translatedStatus = $this->statusTranslations[$newStatus] ?? $newStatus;
        $emoji = $this->statusEmojis[$newStatus] ?? '';
    
        foreach ($admins as $admin) {
            $message = '';
    
            if ($statusChanged) {
                $message = "{$emoji} {$user->name} zmienił status części '{$part->name}' na '{$translatedStatus}' w projekcie '{$project->name}'";
            } else {
                $message = "{$user->name} zaktualizował część '{$part->name}' w projekcie '{$project->name}'";
            }
    
            Notification::create([
                'user_id' => $admin->id,
                'text' => $message,
                'read' => false,
            ]);
        }
    
    }

    return response()->json($part);
}

    public function destroy($id)
    {
        $part = Part::findOrFail($id);
        $project = $part->project;

        if (!$project) {
            return response()->json(['error' => 'Projekt nie istnieje'], 404);
        }

        $user = auth()->user();
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'text' => " {$user->name} usunął część '{$part->name}' z projektu '{$project->name}'",
                'read' => false,
            ]);
        }

        $part->delete();

        return response()->json(['success' => true]);
    }
}
