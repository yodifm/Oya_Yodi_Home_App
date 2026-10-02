<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Who added, changed or removed what. Written by the LogsActivity trait.
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            // Null for changes made outside a signed-in request (seeding, console),
            // or after the user who made them was deleted.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 16);                    // created | updated | deleted
            $table->string('subject_type', 32)->index();     // expense, reimbursement, …
            $table->unsignedBigInteger('subject_id')->nullable();
            // A readable label captured at the time, so it survives the record being deleted.
            $table->string('summary');
            // For updates: { field: [old, new] }.
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
