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
                    'id' => time() + rand(1, 100000), // unikalne ID (albo użyj Str::uuid())
                    'name' => $file->getClientOriginalName(),
                    'url' => "/storage/{$path}",
                    'type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ];
;
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
            'link' => 'nullable|string|max:255',
            'invoiceAttached' => 'nullable|boolean',
        ]);

        $attachments = $item->invoices ?: [];

        if ($request->hasFile('invoices')) {
            foreach ($request->file('invoices') as $file) {
                $path = $file->store("uploads/projects/project_{$projectId}/shoppinglist", 'public');
                $attachments[] = [
                    'id' => time() + rand(1, 100000), // unikalne ID (albo użyj Str::uuid())
                    'name' => $file->getClientOriginalName(),
                    'url' => "/storage/{$path}",
                    'type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
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

        // ✅ Usuń tylko powiązane pliki
        foreach ($item->invoices ?? [] as $file) {
            $relativePath = str_replace('/storage/', '', $file['url']);
            Storage::disk('public')->delete($relativePath);
        }

        $item->delete();

        return response()->json(['success' => true]);
    }


    public function deleteInvoice($id)
    {
        $items = ShoppingItem::all();

        foreach ($items as $item) {
            $invoices = $item->invoices ?? [];

            foreach ($invoices as $index => $invoice) {
                if ((string)($invoice['id'] ?? '') === (string)$id) {
                    $relativePath = str_replace('/storage/', '', $invoice['url']);
                    Storage::disk('public')->delete($relativePath);

                    array_splice($invoices, $index, 1);
                    $item->invoices = $invoices;
                    $item->invoiceAttached = count($invoices) > 0;
                    $item->save();

                    return response()->json(['message' => 'Załącznik usunięty']);
                }
            }
        }

        return response()->json(['message' => 'Nie znaleziono pliku'], 404);
    }


}
