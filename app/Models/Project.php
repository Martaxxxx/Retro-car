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

}