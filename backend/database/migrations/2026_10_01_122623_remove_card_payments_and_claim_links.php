<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * - "Card" is no longer a payment method (the household doesn't use one);
 *   existing card payments become bank transfers.
 * - Claims are no longer raised from an expense, so the link is dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('expenses')->where('payment_method', 'card')->update(['payment_method' => 'transfer']);

        Schema::table('reimbursements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('expense_id');
        });
    }

    public function down(): void
    {
        // Which transfers were cards can't be recovered; only the column comes back.
        Schema::table('reimbursements', function (Blueprint $table) {
            $table->foreignId('expense_id')->nullable()->after('notes')
                ->constrained()->nullOnDelete();
        });
    }
};
