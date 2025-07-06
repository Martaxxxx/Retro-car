<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'surname',
        'email',
        'password',
        'role',
        'avatar',
    ];

    protected $visible = ['id', 'name', 'surname'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relacja do powiadomień
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
    // Historia logów
    public function loginLogs()
    {
    return $this->hasMany(LoginLog::class);
    }

    //Relacja do dopisania projektów
    public function projects()
    {
    return $this->belongsToMany(Project::class);
    }

}
