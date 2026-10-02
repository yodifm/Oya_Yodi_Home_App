<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which account a bank transfer came from. Null for cash/e-wallet, and
        // for transfers recorded before banks were tracked.
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('bank', 16)->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('bank');
        });
    }
};
