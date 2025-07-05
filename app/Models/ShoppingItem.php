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
        'invoices', 
    ];

    protected $casts = [
        'invoices' => 'array', 
    ];
}