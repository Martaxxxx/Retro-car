<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations — usuwa kolumny.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['login', 'email_verified_at']);
        });
    }

    /**
     * Reverse the migrations — dodaje kolumny z powrotem.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login')->nullable();
            $table->timestamp('email_verified_at')->nullable();
        });
    }
};

