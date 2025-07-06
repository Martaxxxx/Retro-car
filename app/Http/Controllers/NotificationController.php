<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Pobierz powiadomienia widoczne dla danego użytkownika.
     */
    public function index($userId)
    {
        $limit = max(1, min(request('limit', 20), 100));
        $user = User::findOrFail($userId);

        // Admin i manager widzą wszystkie powiadomienia, nawet jeśli nie są przypisani
        if (in_array($user->role, ['admin', 'manager'])) {
            $notifications = Notification::with(['sender', 'project'])
                ->orderBy('created_at', 'desc')
                ->take($limit)
                ->get();

            // Pobierz dane o przeczytaniu z tabeli pivota
            $pivotData = $user->notifications()->pluck('notification_user.read', 'notifications.id')->toArray();

            return response()->json([
                'notifications' => $notifications->map(function ($note) use ($pivotData) {
                    return [
                        'id' => $note->id,
                        'text' => $note->text,
                        'read' => array_key_exists($note->id, $pivotData) ? (bool) $pivotData[$note->id] : false,
                        'created_at' => $note->created_at,
                        'project' => [
                            'id' => $note->project?->id,
                            'name' => $note->project?->name,
                        ],
                        'user' => [
                            'name' => $note->sender?->name,
                            'avatar' => $note->sender?->avatar,
                        ],
                    ];
                }),
            ]);
        }

        // Zwykli użytkownicy widzą tylko przypisane powiadomienia
        $notifications = $user->notifications()
            ->with(['sender', 'project'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        return response()->json([
            'notifications' => $notifications->map(function ($note) {
                return [
                    'id' => $note->id,
                    'text' => $note->text,
                    'read' => $note->pivot ? (bool) $note->pivot->read : false,
                    'created_at' => $note->created_at,
                    'project' => [
                        'id' => $note->project?->id,
                        'name' => $note->project?->name,
                    ],
                    'user' => [
                        'name' => $note->sender?->name,
                        'avatar' => $note->sender?->avatar,
                    ],
                ];
            }),
        ]);
    }

    /**
     * Oznacz wszystkie powiadomienia użytkownika jako przeczytane.
     * (admin/manager: oznacza wszystkie powiadomienia, nawet jeśli nie mają wpisu w pivocie)
     */
    public function markAllAsRead($userId)
    {
        $user = User::findOrFail($userId);

        if (in_array($user->role, ['admin', 'manager'])) {
            // Oznacz wszystkie powiadomienia jako przeczytane (stwórz wpisy w pivocie jeśli nie istnieją)
            $allNotificationIds = Notification::pluck('id');
            foreach ($allNotificationIds as $nid) {
                if (!$user->notifications()->where('notifications.id', $nid)->exists()) {
                    $user->notifications()->attach($nid, ['read' => true]);
                } else {
                    $user->notifications()->updateExistingPivot($nid, ['read' => true]);
                }
            }
        } else {
            // Zwykły user – tylko powiadomienia przypisane przez pivot
            $notificationIds = $user->notifications()->pluck('notifications.id');
            if ($notificationIds->isNotEmpty()) {
                foreach ($notificationIds as $nid) {
                    $user->notifications()->updateExistingPivot($nid, ['read' => true]);
                }
            }
        }

        return response()->json(['status' => 'all marked as read']);
    }

    /**
     * Oznacz pojedyncze powiadomienie jako przeczytane.
     * (admin/manager: tworzy wpis w pivocie jeśli go nie ma)
     */
    public function markSingleAsRead(Request $request, $userId)
    {
        $request->validate([
            'notification_id' => 'required|integer',
        ]);

        $user = User::findOrFail($userId);
        $notificationId = $request->notification_id;

        // Sprawdź, czy powiadomienie istnieje
        $notification = Notification::findOrFail($notificationId);

        if (in_array($user->role, ['admin', 'manager'])) {
            // Jeśli nie ma wpisu w pivocie, utwórz go i oznacz jako przeczytane
            if (!$user->notifications()->where('notifications.id', $notificationId)->exists()) {
                $user->notifications()->attach($notificationId, ['read' => true]);
            } else {
                $user->notifications()->updateExistingPivot($notificationId, ['read' => true]);
            }
            return response()->json(['status' => 'single marked as read']);
        }

        // Zwykły user – sprawdź, czy przypisany przez pivot
        if (!$user->notifications()->where('notifications.id', $notificationId)->exists()) {
            return response()->json(['status' => 'forbidden'], 403);
        }

        $user->notifications()->updateExistingPivot($notificationId, ['read' => true]);

        return response()->json(['status' => 'single marked as read']);
    }
}