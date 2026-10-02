<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('recurring_expense_id')->nullable()->after('notes')
                ->constrained()->nullOnDelete();
            $table->string('receipt_path')->nullable()->after('recurring_expense_id');
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            // The expense this claim was raised from, if any.
            $table->foreignId('expense_id')->nullable()->after('notes')
                ->constrained()->nullOnDelete();
            $table->string('receipt_path')->nullable()->after('expense_id');
        });

        Schema::table('wishlist_items', function (Blueprint $table) {
            // The expense recorded when the item was purchased.
            $table->foreignId('expense_id')->nullable()->after('notes')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('expense_id');
        });

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('expense_id');
            $table->dropColumn('receipt_path');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_expense_id');
            $table->dropColumn('receipt_path');
        });
    }
};
