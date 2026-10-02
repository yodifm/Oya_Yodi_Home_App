<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Who added the wish. By id (not name) so renaming a user keeps it right;
        // null for wishes added before this was tracked, or by a deleted user.
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->foreignId('created_by_id')->nullable()->after('expense_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by_id');
        });
    }
};
