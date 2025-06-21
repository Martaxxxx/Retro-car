<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShoppingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'notes',
        'priceNet',
        'priceGross',
        'status',
        'link',
        'invoiceAttached',
        'invoices', // <-- DODAJ to pole, żeby można je masowo przypisywać!
    ];

    protected $casts = [
        'invoices' => 'array', // <-- DODAJ to, żeby 'invoices' był automatycznie arrayem
    ];
}