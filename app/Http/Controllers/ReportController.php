<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ShoppingItem;
use App\Models\Part;

class ReportController extends Controller
{ 
    public function costsData(Request $request)
    {
        $projectIds = $request->input('projectIds', []);
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');

        $projects = Project::whereIn('id', $projectIds)->get();
        $result = [];

        foreach ($projects as $project) {
            $shoppingList = ShoppingItem::where('project_id', $project->id)
    ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
    ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
    ->get()
    ->map(fn($item) => [
        'id' => $item->id,
        'name' => $item->name,
        'priceNet' => $item->priceNet,
        'priceGross' => $item->priceGross,
        'status' => $item->status,
        'createdAt' => optional($item->created_at)->toDateString(),
    ]);
            $result[] = [
                'id' => $project->id,
                'name' => $project->name,
                'shoppingList' => $shoppingList
            ];
        }

        return response()->json(['projects' => $result]);
    }

    public function progressData(Request $request)
    {
        $projectIds = $request->input('projectIds', []);
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');

        $projects = Project::whereIn('id', $projectIds)->get();
        $result = [];

        foreach ($projects as $project) {
            $parts = Part::where('project_id', $project->id)
                ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
                ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
                ->get()
                ->map(fn($part) => [
                    'id' => $part->id,
                    'name' => $part->name,
                    'status' => $part->status,
                    'createdAt' => optional($part->created_at)->toDateString(),
                ]);
            $result[] = [
                'id' => $project->id,
                'name' => $project->name,
                'parts' => $parts
            ];
        }

        return response()->json(['projects' => $result]);
    }
}