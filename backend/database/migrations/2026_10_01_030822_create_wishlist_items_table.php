<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('estimated_price');
            $table->unsignedBigInteger('saved_amount')->default(0);
            $table->string('priority', 8)->default('medium');
            $table->string('status', 16)->default('wanted')->index();
            $table->date('target_date')->nullable();
            $table->string('url', 2048)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist_items');
    }
};
