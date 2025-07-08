<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUniqueProjectPartCodeToPartsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('parts', function (Blueprint $table) {
            // Dodaj unikalny indeks na kombinację project_id + part_code
            $table->unique(['project_id', 'part_code'], 'project_part_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('parts', function (Blueprint $table) {
            $table->dropUnique('project_part_code_unique');
        });
    }
}