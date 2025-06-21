<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShoppingItem;

class ShoppingListController extends Controller
{
    // Pobierz listę zakupów dla danego projektu (z poprawnym zwracaniem załączników)
    public function index($projectId)
    {
        // Jeśli masz w modelu $casts ['invoices' => 'array'], poniższe działa automatycznie
        $items = ShoppingItem::where('project_id', $projectId)->get();

        // Możesz jawnie upewnić się, że 'invoices' są zawsze tablicą:
        foreach ($items as $item) {
            if (!is_array($item->invoices)) {
                $item->invoices = [];
            }
        }

        return response()->json($items);
    }

    // Dodaj pozycję do listy zakupów dla projektu (z obsługą uploadu plików)
    public function store(Request $request, $projectId)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'priceNet' => 'required|numeric',
            'priceGross' => 'required|numeric',
            'status' => 'required|in:dozamowienia,zamowione,dostarczone',
            'link' => 'nullable|url',
        ]);

        $data['project_id'] = $projectId;
        $data['invoiceAttached'] = false;

        // Obsługa uploadu plików
        $attachments = [];
        if ($request->hasFile('invoices')) {
            foreach ($request->file('invoices') as $file) {
                $path = $file->store('invoices', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => asset('storage/' . $path),
                ];
            }
            $data['invoiceAttached'] = count($attachments) > 0;
        }
        $data['invoices'] = $attachments;

        $item = ShoppingItem::create($data);

        // Upewnij się, że pole invoices jest arrayem w odpowiedzi
        if (!is_array($item->invoices)) {
            $item->invoices = [];
        }

        return response()->json($item, 201);
    }

    // Edytuj pozycję na liście zakupów (z obsługą uploadu plików)
    public function update(Request $request, $id)
    {
        $item = ShoppingItem::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'priceNet' => 'sometimes|required|numeric',
            'priceGross' => 'sometimes|required|numeric',
            'status' => 'sometimes|required|in:dozamowienia,zamowione,dostarczone',
            'link' => 'nullable|url',
            'invoiceAttached' => 'nullable|boolean',
            // invoices NIE walidujemy jako array, bo mogą być pliki (multipart)
        ]);

        // Obsługa uploadu plików
        $attachments = $item->invoices ?: [];
        if ($request->hasFile('invoices')) {
            foreach ($request->file('invoices') as $file) {
                $path = $file->store('invoices', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => asset('storage/' . $path),
                ];
            }
            $data['invoiceAttached'] = count($attachments) > 0;
        }
        $data['invoices'] = $attachments;

        $item->update($data);

        // Upewnij się, że pole invoices jest arrayem w odpowiedzi
        if (!is_array($item->invoices)) {
            $item->invoices = [];
        }

        return response()->json($item);
    }

    // Usuń pozycję z listy zakupów
    public function destroy($id)
    {
        $item = ShoppingItem::findOrFail($id);
        $item->delete();

        return response()->json(['success' => true]);
    }
}