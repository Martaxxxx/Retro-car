<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('notifications', function (Blueprint $table) {
        $table->unsignedBigInteger('project_id')->nullable()->after('id');
        $table->unsignedBigInteger('sender_id')->nullable()->after('project_id');
        $table->index('project_id');
        $table->index('sender_id');
    });
}

public function down()
{
    Schema::table('notifications', function (Blueprint $table) {
        $table->dropIndex(['project_id']);
        $table->dropIndex(['sender_id']);
        $table->dropColumn('project_id');
        $table->dropColumn('sender_id');
    });
}
};
