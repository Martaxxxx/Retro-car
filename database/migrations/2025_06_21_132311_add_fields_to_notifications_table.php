<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'user_id')) {
                $table->unsignedBigInteger('user_id')->after('id');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
    
            if (!Schema::hasColumn('notifications', 'text')) {
                $table->string('text')->after('user_id');
            }
    
            if (!Schema::hasColumn('notifications', 'read')) {
                $table->boolean('read')->default(false)->after('text');
            }
        });
    }
    
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'text', 'read']);
        });
    }
    
};
