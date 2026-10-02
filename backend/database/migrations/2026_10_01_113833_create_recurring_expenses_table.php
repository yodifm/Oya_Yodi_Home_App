<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Templates for bills that repeat every month (electricity, internet, school fees…).
        Schema::create('recurring_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category', 32);
            $table->unsignedBigInteger('amount');
            $table->string('payment_method', 16);
            $table->string('paid_by', 64);
            // Clamped to the month's length, so 31 means "last day of the month".
            $table->unsignedTinyInteger('day_of_month');
            $table->date('starts_on');
            // Date of the most recent expense generated from this template.
            $table->date('last_generated_on')->nullable();
            $table->boolean('active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_expenses');
    }
};
