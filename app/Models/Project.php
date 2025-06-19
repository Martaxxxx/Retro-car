<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    // Pozwól na masowe przypisanie tych pól
    protected $fillable = [
        'name',
        'image',
        'start_date',
        'end_date',
        'status',
        'brand',
        'model',
        'year',
        'car_id',
    ];

    // RELACJA DO CZĘŚCI
    public function parts()
    {
        return $this->hasMany(\App\Models\Part::class);
    }
}