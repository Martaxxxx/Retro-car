<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Pobierz powiadomienia danego użytkownika
    public function index($userId)
    {
        $limit = request('limit', 20);

        $notifications = Notification::where('user_id', $userId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        return response()->json([
            'notifications' => $notifications->map(function ($note) {
                return [
                    'id' => $note->id,
                    'text' => $note->text,
                    'read' => $note->read,
                    'created_at' => $note->created_at,
                    'user' => [
                        'name' => $note->user?->name,
                        'avatar' => $note->user?->avatar,
                    ],
                ];
            }),
        ]);
    }

    // Oznacz wszystkie jako przeczytane
    public function markAllAsRead($userId)
    {
        Notification::where('user_id', $userId)->update(['read' => true]);

        return response()->json(['status' => 'all marked as read']);
    }

    // Oznacz pojedyncze powiadomienie jako przeczytane
    public function markSingleAsRead(Request $request, $userId)
{
    $request->validate([
        'notification_id' => 'required|integer',
    ]);

    $notification = Notification::where('id', $request->notification_id)
        ->where('user_id', $userId)
        ->firstOrFail(); // Jeśli nie znajdzie — rzuci 404, nie 500

    $notification->update(['read' => true]);

    return response()->json(['status' => 'single marked as read']);
}

}
