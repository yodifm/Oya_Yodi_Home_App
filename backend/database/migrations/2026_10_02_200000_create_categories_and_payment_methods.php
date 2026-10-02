<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Categories, payment methods and their accounts (banks, e-wallets) move from
 * code into tables the household manages on the "Categories & Payments" page.
 * Records keep referring to them by key, and the defaults below reuse the old
 * keys, so existing expenses and budgets stay valid without a data change.
 */
return new class extends Migration
{
    private const CATEGORIES = [
        'groceries' => 'Groceries',
        'food' => 'Food',
        'utilities' => 'Utilities',
        'transport' => 'Transport',
        'household' => 'Household Supplies',
        'health' => 'Health',
        'education' => 'Education',
        'entertainment' => 'Entertainment',
        'other' => 'Other',
    ];

    private const METHODS = [
        'cash' => ['Cash', []],
        'transfer' => ['Bank Transfer', ['bca' => 'BCA', 'line_bank' => 'Line Bank', 'mandiri' => 'Mandiri']],
        'e-wallet' => ['E-Wallet', []],
    ];

    public function up(): void
    {
        foreach (['categories', 'payment_methods'] as $table) {
            Schema::create($table, function (Blueprint $t) {
                $t->id();
                $t->string('key', 32)->unique();
                $t->string('name', 40);
                $t->unsignedSmallInteger('position')->default(0);
                // Hidden from new entries but kept, because records still use it.
                $t->timestamp('archived_at')->nullable();
                $t->timestamps();
            });
        }

        Schema::create('payment_accounts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('payment_method_id')->constrained()->cascadeOnDelete();
            $t->string('key', 32)->unique();
            $t->string('name', 40);
            $t->unsignedSmallInteger('position')->default(0);
            $t->timestamp('archived_at')->nullable();
            $t->timestamps();
        });

        $now = now();
        $position = 0;
        foreach (self::CATEGORIES as $key => $name) {
            DB::table('categories')->insert(['key' => $key, 'name' => $name, 'position' => ++$position, 'created_at' => $now, 'updated_at' => $now]);
        }

        $position = 0;
        foreach (self::METHODS as $key => [$name, $accounts]) {
            $methodId = DB::table('payment_methods')->insertGetId(['key' => $key, 'name' => $name, 'position' => ++$position, 'created_at' => $now, 'updated_at' => $now]);
            $accountPosition = 0;
            foreach ($accounts as $accountKey => $accountName) {
                DB::table('payment_accounts')->insert([
                    'payment_method_id' => $methodId, 'key' => $accountKey, 'name' => $accountName,
                    'position' => ++$accountPosition, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }

        // "bank" becomes the account used with any method (a bank, GoPay, OVO…).
        Schema::table('expenses', function (Blueprint $t) {
            $t->renameColumn('bank', 'payment_account');
        });
        Schema::table('expenses', function (Blueprint $t) {
            $t->string('payment_method', 32)->change();
            $t->string('payment_account', 32)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $t) {
            $t->renameColumn('payment_account', 'bank');
        });
        Schema::dropIfExists('payment_accounts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('categories');
    }
};
