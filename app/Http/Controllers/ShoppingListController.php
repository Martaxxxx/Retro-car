<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShoppingItem;

class ShoppingListController extends Controller
{
    public function index($projectId)
    {
        return ShoppingItem::where('project_id', $projectId)->get();
    }

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

        return ShoppingItem::create($data);
    }

    public function update(Request $request, $id)
    {
        $item = ShoppingItem::findOrFail($id);

        $item->update($request->all());

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $item = ShoppingItem::findOrFail($id);
        $item->delete();

        return response()->json(['success' => true]);
    }
}
