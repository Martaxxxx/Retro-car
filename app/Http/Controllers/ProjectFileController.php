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
            'files.*' => 'required|file|max:10240', // max 10MB na plik
        ]);

        $uploaded = [];

        foreach ($request->file('files', []) as $file) {
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("uploads/projects/project_{$projectId}/renovation", $filename, 'public');

            $uploaded[] = ProjectFile::create([
                'project_id' => $projectId,
                'original_name' => $file->getClientOriginalName(),
                'stored_path' => "/storage/{$path}",
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        return response()->json($uploaded, 201);
    }

    public function destroy($id)
    {
        $file = ProjectFile::findOrFail($id);
        Storage::disk('public')->delete(str_replace('/storage/', '', $file->stored_path));
        $file->delete();

        return response()->json(['success' => true]);
    }
}
