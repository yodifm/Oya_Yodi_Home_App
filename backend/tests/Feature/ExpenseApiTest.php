<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signIn();
    }

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Weekly groceries',
            'category' => 'groceries',
            'amount' => 250000,
            'spent_at' => now()->toDateString(),
            'payment_method' => 'cash',
            'paid_by' => 'Oya',
            'notes' => null,
            ...$overrides,
        ];
    }

    public function test_it_creates_an_expense(): void
    {
        $this->postJson('/api/expenses', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.title', 'Weekly groceries')
            ->assertJsonPath('data.amount', 250000);

        $this->assertDatabaseCount('expenses', 1);
    }

    public function test_it_rejects_invalid_input_with_friendly_messages(): void
    {
        $this->postJson('/api/expenses', $this->payload(['amount' => 0, 'category' => 'yacht']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['amount', 'category'])
            ->assertJsonPath('errors.amount.0', 'The amount field must be at least 1.');
    }

    public function test_bank_transfers_need_a_bank(): void
    {
        $this->postJson('/api/expenses', $this->payload(['payment_method' => 'transfer']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.bank.0', 'The bank field is required when payment method is bank transfer.');

        $this->postJson('/api/expenses', $this->payload(['payment_method' => 'transfer', 'bank' => 'jago']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('bank');

        $id = $this->postJson('/api/expenses', $this->payload(['payment_method' => 'transfer', 'bank' => 'line_bank']))
            ->assertCreated()
            ->assertJsonPath('data.bank', 'line_bank')
            ->json('data.id');

        // Switching to cash drops the bank rather than rejecting the request.
        $this->putJson("/api/expenses/{$id}", $this->payload(['payment_method' => 'cash', 'bank' => 'line_bank']))
            ->assertOk()
            ->assertJsonPath('data.bank', null);
    }

    public function test_purchases_by_transfer_need_a_bank_too(): void
    {
        $item = WishlistItem::factory()->create();
        $purchase = ['amount' => 1000, 'category' => 'household', 'spent_at' => now()->toDateString(), 'payment_method' => 'transfer', 'paid_by' => 'Yodi'];

        $this->postJson("/api/wishlist/{$item->id}/purchase", $purchase)->assertJsonValidationErrors('bank');
        $this->postJson("/api/wishlist/{$item->id}/purchase", [...$purchase, 'bank' => 'mandiri'])->assertOk();
        $this->assertSame('mandiri', Expense::latest('id')->first()->bank->value);
    }

    public function test_food_is_a_category(): void
    {
        $this->postJson('/api/expenses', $this->payload(['category' => 'food', 'title' => 'Lunch out']))
            ->assertCreated()
            ->assertJsonPath('data.category', 'food');

        $this->getJson('/api/expenses?category=food')->assertJsonCount(1, 'data');
        $this->assertContains('food', array_column($this->getJson('/api/budgets')->json('data'), 'category'));
    }

    public function test_card_is_no_longer_a_payment_method(): void
    {
        $this->postJson('/api/expenses', $this->payload(['payment_method' => 'card']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_method');
    }

    public function test_it_rejects_future_dates(): void
    {
        $this->postJson('/api/expenses', $this->payload(['spent_at' => now()->addDay()->toDateString()]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('spent_at');
    }

    public function test_it_filters_by_month_and_category(): void
    {
        Expense::factory()->create(['spent_at' => '2026-03-10', 'category' => 'groceries']);
        Expense::factory()->create(['spent_at' => '2026-03-31', 'category' => 'transport']);
        Expense::factory()->create(['spent_at' => '2026-04-01', 'category' => 'groceries']);

        $this->getJson('/api/expenses?month=2026-03')->assertJsonCount(2, 'data');
        $this->getJson('/api/expenses?month=2026-03&category=groceries')->assertJsonCount(1, 'data');
    }

    public function test_it_updates_and_deletes(): void
    {
        $expense = Expense::factory()->create();

        $this->putJson("/api/expenses/{$expense->id}", $this->payload(['title' => 'Updated']))
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated');

        $this->deleteJson("/api/expenses/{$expense->id}")->assertNoContent();
        $this->assertModelMissing($expense);
    }
}
