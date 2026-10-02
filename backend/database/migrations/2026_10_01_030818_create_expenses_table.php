<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category', 32)->index();
            // Whole rupiah — IDR has no minor unit in everyday use.
            $table->unsignedBigInteger('amount');
            $table->date('spent_at')->index();
            $table->string('payment_method', 16);
            $table->string('paid_by', 64);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
