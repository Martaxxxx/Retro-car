<?php

namespace App\Http\Controllers;

use App\Models\Notification;

class NotificationController extends Controller
{
    public function index($userId)
    {
        return Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();
    }

    public function markAllAsRead($userId)
    {
        Notification::where('user_id', $userId)->update(['read' => true]);
        return response()->json(['status' => 'ok']);
    }
}
