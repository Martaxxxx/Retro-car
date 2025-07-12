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
        return $this->hasMany(\App\Models\Part::class, 'project_id');
    }

    // RELACJA DO PLIKÓW
    public function files()
    {
        return $this->hasMany(\App\Models\ProjectFile::class, 'project_id');
    }

    // RELACJA DO POZYCJI ZAKUPOWYCH (SHOPPING ITEMS)
    public function shoppingItems()
    {
        return $this->hasMany(\App\Models\ShoppingItem::class, 'project_id');
    }

    //Relacja do userów
    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    // ACCESSOR: procent ukończenia projektu
    public function getProgressPercentAttribute()
    {
        $parts = $this->parts;
        $count = $parts->count();

        if ($count === 0) {
            return 0;
        }

        $sum = $parts->sum(function ($part) {
            switch ($part->status) {
                case 'ready': return 50;
                case 'installed': return 100;
                default: return 0; // pending
            }
        });

        return round($sum / $count);
    }
}