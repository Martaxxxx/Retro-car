<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'part_code',
        'name',
        'category',
        'notes',
        'status',
        'qr_code_data',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}