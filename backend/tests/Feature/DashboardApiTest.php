<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signIn();
    }

    public function test_it_summarises_the_requested_month(): void
    {
        Expense::factory()->create(['spent_at' => '2026-09-05', 'amount' => 100000, 'category' => 'groceries']);
        Expense::factory()->create(['spent_at' => '2026-09-30', 'amount' => 300000, 'category' => 'utilities']);
        Expense::factory()->create(['spent_at' => '2026-08-15', 'amount' => 50000, 'category' => 'groceries']);
        Reimbursement::factory()->create(['amount' => 70000]);
        Reimbursement::factory()->create(['amount' => 90000, 'status' => 'paid']);
        WishlistItem::factory()->create(['estimated_price' => 1000000, 'saved_amount' => 400000]);
        WishlistItem::factory()->create(['estimated_price' => 500000, 'status' => 'purchased']);

        $res = $this->getJson('/api/dashboard?month=2026-09')->assertOk();

        $res->assertJsonPath('spending.this_month', 400000)
            ->assertJsonPath('spending.last_month', 50000)
            ->assertJsonPath('spending.transactions', 2)
            ->assertJsonPath('by_category.0', ['category' => 'utilities', 'total' => 300000])
            ->assertJsonPath('reimbursements.pending_total', 70000)
            ->assertJsonPath('reimbursements.pending_count', 1)
            ->assertJsonPath('wishlist.remaining_total', 600000)
            ->assertJsonPath('wishlist.open_count', 1)
            ->assertJsonCount(6, 'trend')
            ->assertJsonPath('trend.5', ['month' => '2026-09', 'total' => 400000])
            ->assertJsonPath('trend.4', ['month' => '2026-08', 'total' => 50000])
            ->assertJsonPath('trend.0', ['month' => '2026-04', 'total' => 0]);
    }
}
