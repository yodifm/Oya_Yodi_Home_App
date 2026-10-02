<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetReportExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signIn();
    }

    public function test_budgets_can_be_set_listed_and_removed(): void
    {
        Expense::factory()->create(['category' => 'groceries', 'amount' => 400000, 'spent_at' => now()->toDateString()]);

        $this->putJson('/api/budgets/groceries', ['amount' => 1000000])->assertOk();

        $row = collect($this->getJson('/api/budgets')->assertOk()->json('data'))->firstWhere('category', 'groceries');
        $this->assertSame(['category' => 'groceries', 'limit' => 1000000, 'spent' => 400000], $row);

        $this->getJson('/api/dashboard')->assertJsonPath('budgets', [$row]);

        $this->putJson('/api/budgets/groceries', ['amount' => null])->assertOk();
        $this->assertSame(0, Budget::count());

        $this->putJson('/api/budgets/yachts', ['amount' => 1])->assertNotFound();
        $this->putJson('/api/budgets/groceries', ['amount' => 0])->assertUnprocessable();
    }

    public function test_report_summarises_a_year(): void
    {
        Expense::factory()->create(['spent_at' => '2025-03-10', 'amount' => 300000, 'category' => 'groceries']);
        Expense::factory()->create(['spent_at' => '2025-04-10', 'amount' => 100000, 'category' => 'groceries']);
        Expense::factory()->create(['spent_at' => '2025-04-20', 'amount' => 600000, 'category' => 'health']);
        Expense::factory()->create(['spent_at' => '2024-12-31', 'amount' => 50000, 'category' => 'other']);

        $this->getJson('/api/reports?year=2025&month=2025-04')
            ->assertOk()
            ->assertJsonPath('total', 1000000)
            ->assertJsonPath('previous_year_total', 50000)
            // First expense is in March, so the average covers March–December.
            ->assertJsonPath('months_elapsed', 10)
            ->assertJsonPath('average_per_month', 100000)
            ->assertJsonPath('highest_month', ['month' => '2025-04', 'total' => 700000])
            ->assertJsonCount(12, 'months')
            ->assertJsonPath('by_category.0', ['category' => 'health', 'total' => 600000, 'share' => 60])
            // April vs March: health +600k, groceries −200k.
            ->assertJsonPath('changes.rows.0', ['category' => 'health', 'current' => 600000, 'previous' => 0, 'change' => 600000])
            ->assertJsonPath('changes.rows.1.change', -200000);

        // Without a month, a past year focuses on December — not on how many months had data.
        $this->getJson('/api/reports?year=2025')
            ->assertJsonPath('changes.month', '2025-12')
            ->assertJsonPath('changes.previous_month', '2025-11');
        $this->getJson('/api/reports')->assertJsonPath('changes.month', now()->format('Y-m'));
    }

    public function test_csv_export_respects_filters(): void
    {
        Expense::factory()->create(['spent_at' => '2026-03-02', 'title' => 'Rice, 10kg', 'category' => 'groceries', 'amount' => 150000]);
        Expense::factory()->create(['spent_at' => '2026-03-03', 'title' => 'Fuel', 'category' => 'transport']);
        Expense::factory()->create(['spent_at' => '2026-04-01', 'title' => 'April thing', 'category' => 'groceries']);

        $res = $this->get('/api/expenses/export?month=2026-03&category=groceries')->assertOk();
        $csv = $res->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBFsep=,\n", $csv);
        $this->assertStringContainsString('"Rice, 10kg",groceries,150000', $csv);
        $this->assertStringNotContainsString('Fuel', $csv);
        $this->assertStringNotContainsString('April thing', $csv);
        $this->assertStringContainsString('expenses-2026-03.csv', $res->headers->get('content-disposition'));
    }

    public function test_expense_list_is_paginated_with_a_summary_of_all_matches(): void
    {
        Expense::factory(25)->create(['spent_at' => now()->toDateString(), 'amount' => 1000, 'title' => 'Snack']);
        Expense::factory()->create(['spent_at' => now()->toDateString(), 'amount' => 5000, 'title' => 'Cake']);

        $this->getJson('/api/expenses?month='.now()->format('Y-m'))
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 26)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('summary.total_amount', 30000);

        $this->getJson('/api/expenses?q=cak')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.total_amount', 5000);
    }
}
