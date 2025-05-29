<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Renovation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand',
        'year',
        'status',
        'image',
        'user_id',
        'end_date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
