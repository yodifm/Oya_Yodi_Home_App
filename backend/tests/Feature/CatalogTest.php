<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Expense;
use App\Models\PaymentAccount;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['name' => 'Yodi']));
    }

    private function expense(array $overrides = []): array
    {
        return [
            'title' => 'Test', 'category' => 'groceries', 'amount' => 10000, 'spent_at' => now()->toDateString(),
            'payment_method' => 'cash', 'payment_account' => null, 'paid_by' => 'Yodi', 'notes' => null,
            ...$overrides,
        ];
    }

    public function test_defaults_keep_the_old_keys(): void
    {
        $res = $this->getJson('/api/catalog')->assertOk();

        $this->assertSame(
            ['groceries', 'food', 'utilities', 'transport', 'household', 'health', 'education', 'entertainment', 'other'],
            array_column($res->json('categories'), 'key'),
        );
        $transfer = collect($res->json('payment_methods'))->firstWhere('key', 'transfer');
        $this->assertSame('Bank Transfer', $transfer['name']);
        $this->assertSame(['BCA', 'Line Bank', 'Mandiri'], array_column($transfer['accounts'], 'name'));
    }

    public function test_a_new_category_can_be_used_and_renamed_without_touching_records(): void
    {
        $key = $this->postJson('/api/categories', ['name' => 'Pets'])->assertCreated()->json('data.key');
        $this->assertSame('pets', $key);

        $this->postJson('/api/expenses', $this->expense(['category' => 'pets']))->assertCreated();
        $id = Category::where('key', 'pets')->value('id');
        $this->patchJson("/api/categories/{$id}", ['name' => 'Pet Care'])->assertOk()->assertJsonPath('data.usage', 1);

        $this->assertSame('pets', Expense::first()->category);
        $this->postJson('/api/categories', ['name' => 'Pet Care'])->assertJsonValidationErrors('name');
    }

    public function test_deleting_an_unused_category_removes_it_and_its_budget(): void
    {
        $id = Category::where('key', 'education')->value('id');
        Budget::create(['category' => 'education', 'amount' => 500000]);

        $this->deleteJson("/api/categories/{$id}")->assertOk()->assertJsonPath('result', 'deleted');

        $this->assertDatabaseMissing('categories', ['key' => 'education']);
        $this->assertDatabaseMissing('budgets', ['category' => 'education']);
    }

    public function test_a_used_category_is_hidden_instead_and_old_records_keep_it(): void
    {
        $expense = Expense::factory()->create(['category' => 'health']);
        $id = Category::where('key', 'health')->value('id');

        $this->deleteJson("/api/categories/{$id}")->assertOk()->assertJsonPath('result', 'archived');

        // Not offered for new entries or budgets…
        $this->postJson('/api/expenses', $this->expense(['category' => 'health']))->assertJsonValidationErrors('category');
        $this->putJson('/api/budgets/health', ['amount' => 100000])->assertNotFound();
        $this->assertNotContains('health', array_column($this->getJson('/api/budgets')->json('data'), 'category'));
        // …but an existing expense can still be edited without changing it.
        $this->putJson("/api/expenses/{$expense->id}", $this->expense(['category' => 'health', 'title' => 'Edited']))->assertOk();

        // Shown again, it is selectable again.
        $this->patchJson("/api/categories/{$id}", ['archived' => false])->assertJsonPath('data.archived', false);
        $this->postJson('/api/expenses', $this->expense(['category' => 'health']))->assertCreated();
    }

    public function test_the_last_category_and_payment_method_cannot_go(): void
    {
        Category::where('key', '!=', 'other')->update(['archived_at' => now()]);
        $this->deleteJson('/api/categories/'.Category::where('key', 'other')->value('id'))
            ->assertJsonValidationErrors('name');

        PaymentMethod::where('key', '!=', 'cash')->delete();
        $this->patchJson('/api/payment-methods/'.PaymentMethod::where('key', 'cash')->value('id'), ['archived' => true])
            ->assertJsonValidationErrors('name');
    }

    public function test_accounts_belong_to_their_method(): void
    {
        $wallet = PaymentMethod::where('key', 'e-wallet')->first();

        // No accounts yet: any account sent is dropped.
        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'e-wallet', 'payment_account' => 'bca']))
            ->assertCreated()->assertJsonPath('data.payment_account', null);

        $this->postJson("/api/payment-methods/{$wallet->id}/accounts", ['name' => 'GoPay'])->assertCreated();

        // Now one is required, and it must be one of the e-wallet's own.
        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'e-wallet']))->assertJsonValidationErrors('payment_account');
        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'e-wallet', 'payment_account' => 'bca']))->assertJsonValidationErrors('payment_account');
        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'e-wallet', 'payment_account' => 'gopay']))
            ->assertCreated()->assertJsonPath('data.payment_account', 'gopay');

        // The same name may exist under another method, not twice under one.
        $this->postJson("/api/payment-methods/{$wallet->id}/accounts", ['name' => 'GoPay'])->assertJsonValidationErrors('name');
    }

    public function test_a_used_account_is_hidden_and_an_unused_one_deleted(): void
    {
        Expense::factory()->create(['payment_method' => 'transfer', 'payment_account' => 'bca']);

        $this->deleteJson('/api/payment-accounts/'.PaymentAccount::where('key', 'bca')->value('id'))->assertJsonPath('result', 'archived');
        $this->deleteJson('/api/payment-accounts/'.PaymentAccount::where('key', 'mandiri')->value('id'))->assertJsonPath('result', 'deleted');

        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'transfer', 'payment_account' => 'bca']))->assertJsonValidationErrors('payment_account');
        $this->postJson('/api/expenses', $this->expense(['payment_method' => 'transfer', 'payment_account' => 'line_bank']))->assertCreated();
    }

    public function test_reorder_sets_the_dropdown_order(): void
    {
        $ids = Category::ordered()->pluck('id')->reverse()->values()->all();

        $this->putJson('/api/categories/order', ['ids' => $ids])->assertOk();

        $this->assertSame($ids, Category::ordered()->pluck('id')->all());
        $this->assertSame('other', $this->getJson('/api/budgets')->json('data.0.category'));
        $this->putJson('/api/categories/order', ['ids' => [999]])->assertJsonValidationErrors('ids.0');
    }

    public function test_changes_appear_in_the_activity_history(): void
    {
        $id = $this->postJson('/api/categories', ['name' => 'Pets'])->json('data.id');
        $this->patchJson("/api/categories/{$id}", ['name' => 'Pet Care', 'archived' => true]);
        $wallet = PaymentMethod::where('key', 'e-wallet')->value('id');
        $this->postJson("/api/payment-methods/{$wallet}/accounts", ['name' => 'OVO']);

        $categories = $this->getJson('/api/activity?subject_type=category')->json('data');
        $this->assertSame(['Pet Care', 'Pets'], array_column($categories, 'summary'));
        $this->assertSame(['name' => ['Pets', 'Pet Care'], 'archived' => [false, true]], $categories[0]['changes']);

        $this->assertSame('OVO', $this->getJson('/api/activity?subject_type=payment')->json('data.0.summary'));
    }

    public function test_emails_and_csv_use_the_current_names(): void
    {
        $this->patchJson('/api/categories/'.Category::where('key', 'food')->value('id'), ['name' => 'Eating Out']);
        Expense::factory()->create(['spent_at' => '2026-03-02', 'title' => 'Bakso', 'category' => 'food', 'amount' => 30000, 'payment_method' => 'transfer', 'payment_account' => 'bca']);

        $csv = $this->get('/api/expenses/export?month=2026-03')->streamedContent();

        $this->assertStringContainsString('Bakso,"Eating Out",30000,"Bank Transfer",BCA', $csv);
    }
}
