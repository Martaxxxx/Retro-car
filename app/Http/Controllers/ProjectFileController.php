<?php

namespace App\Http\Controllers;

use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectFileController extends Controller
{
    public function index($projectId)
    {
        $files = ProjectFile::where('project_id', $projectId)->get();
        return response()->json($files);
    }

    public function store(Request $request, $projectId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs("uploads/projects/project_{$projectId}/renovation", $filename, 'public');

        $uploaded = ProjectFile::create([
            'project_id' => $projectId,
            'original_name' => $file->getClientOriginalName(),
            'stored_path' => "/storage/{$path}",
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

    // Zwracamy dane w formacie pasującym do frontendu
    return response()->json([
        'id' => $uploaded->id,
        'name' => $uploaded->original_name,
        'url' => $uploaded->stored_path,
        'size' => $uploaded->size,
        'type' => $uploaded->mime_type,
    ], 201);
}


    public function destroy($id)
    {
        $file = ProjectFile::findOrFail($id);

        // Usuń fizyczny plik z dysku
        $relativePath = str_replace('/storage/', '', $file->stored_path);
        \Log::info("Usuwanie pliku: $relativePath");
        Storage::disk('public')->delete($relativePath);

        // Usuń z bazy
        $file->delete();

        return response()->json(['success' => true]);
    }

}
