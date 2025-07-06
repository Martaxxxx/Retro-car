<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Project;

class Notification extends Model
{
    protected $fillable = [
        'project_id',    // ID projektu, którego dotyczy powiadomienie
        'sender_id',     // Kto wykonał akcję (użytkownik generujący powiadomienie)
        'text',          // Treść powiadomienia
        'type',          // Typ powiadomienia: 'part', 'shopping', itp.
    ];

    // Relacja: kto wykonał akcję (autor powiadomienia)
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Relacja: do jakiego projektu należy powiadomienie
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Relacja: użytkownicy, którzy otrzymali powiadomienie (pivot notification_user)
    public function users()
    {
        return $this->belongsToMany(User::class, 'notification_user')
            ->withPivot('read')
            ->withTimestamps();
    }
}