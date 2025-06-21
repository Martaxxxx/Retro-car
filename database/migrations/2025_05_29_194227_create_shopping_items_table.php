<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shopping_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name');
            $table->text('notes')->nullable();
            $table->decimal('priceNet', 10, 2)->default(0);
            $table->decimal('priceGross', 10, 2)->default(0);
            $table->enum('status', ['dozamowienia', 'zamowione', 'dostarczone'])->default('dozamowienia');
            $table->string('link')->nullable();
            $table->boolean('invoiceAttached')->default(false);
            $table->json('invoices')->nullable(); // <-- TO DODAJ!
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_items');
    }
};