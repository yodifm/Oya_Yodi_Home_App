<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Recurring feature was removed. Its earlier migrations had already run on
 * the live database, so it is dropped here rather than by editing history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_expense_id');
        });

        Schema::dropIfExists('recurring_expenses');
    }

    public function down(): void
    {
        Schema::create('recurring_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category', 32);
            $table->unsignedBigInteger('amount');
            $table->string('payment_method', 16);
            $table->string('paid_by', 64);
            $table->unsignedTinyInteger('day_of_month');
            $table->date('starts_on');
            $table->date('last_generated_on')->nullable();
            $table->boolean('active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('recurring_expense_id')->nullable()->after('notes')
                ->constrained()->nullOnDelete();
        });
    }
};
