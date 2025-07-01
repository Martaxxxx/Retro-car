<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\ShoppingItem;

class ShoppingListController extends Controller
{
    public function index($projectId)
    {
        $items = ShoppingItem::where('project_id', $projectId)->get();

        foreach ($items as $item) {
            if (!is_array($item->invoices)) {
                $item->invoices = [];
            }
        }

        return response()->json($items);
    }

    public function store(Request $request, $projectId)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'priceNet' => 'required|numeric',
            'priceGross' => 'required|numeric',
            'status' => 'required|in:dozamowienia,zamowione,dostarczone',
            'link' => 'nullable|string|max:255',
        ]);

        $data['project_id'] = $projectId;
        $data['invoiceAttached'] = false;
        $data['invoices'] = [];

        $item = ShoppingItem::create($data);

        $attachments = [];
        if ($request->hasFile('invoices')) {
            foreach ($request->file('invoices') as $file) {
                $path = $file->store("uploads/projects/project_{$projectId}/shoppinglist", 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => "/storage/{$path}",
                ];
            }
            $item->invoices = $attachments;
            $item->invoiceAttached = count($attachments) > 0;
            $item->save();
        }

        return response()->json($item, 201);
    }

    public function update(Request $request, $id)
    {
        $item = ShoppingItem::findOrFail($id);
        $projectId = $item->project_id;

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'priceNet' => 'sometimes|required|numeric',
            'priceGross' => 'sometimes|required|numeric',
            'status' => 'sometimes|required|in:dozamowienia,zamowione,dostarczone',
            'link' => 'nullable|url',
            'invoiceAttached' => 'nullable|boolean',
        ]);

        $attachments = $item->invoices ?: [];

        if ($request->hasFile('invoices')) {
            foreach ($request->file('invoices') as $file) {
                $path = $file->store("uploads/projects/project_{$projectId}/shoppinglist", 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => "/storage/{$path}",
                ];
            }
        }

        $data['invoices'] = $attachments;
        $data['invoiceAttached'] = count($attachments) > 0;

        $item->update($data);

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = ShoppingItem::findOrFail($id);
        $projectId = $item->project_id;

        // Usuń wszystkie pliki z folderu uploads/projects/project_{id}/shoppinglist
        Storage::disk('public')->deleteDirectory("uploads/projects/project_{$projectId}/shoppinglist");

        $item->delete();

        return response()->json(['success' => true]);
    }

    public function deleteInvoice(Request $request)
    {
        $validated = $request->validate([
            'itemId' => 'required|integer|exists:shopping_items,id',
            'index' => 'required|integer|min:0',
        ]);

        $item = ShoppingItem::findOrFail($validated['itemId']);
        $invoices = $item->invoices ?? [];

        if (!isset($invoices[$validated['index']])) {
            return response()->json(['error' => 'Załącznik nie istnieje'], 404);
        }

        $relativePath = str_replace('/storage/', '', $invoices[$validated['index']]['url']);
        Storage::disk('public')->delete($relativePath);

        array_splice($invoices, $validated['index'], 1);

        $item->invoices = $invoices;
        $item->invoiceAttached = count($invoices) > 0;
        $item->save();

        return response()->json(['success' => true]);
    }
}
