<?php

namespace Database\Seeders;

use App\Enums\ReimbursementStatus;
use App\Enums\WishlistPriority;
use App\Enums\WishlistStatus;
use App\Models\ActivityLog;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\WishlistItem;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Sample household data so the dashboard has something to show.
     * Model events stay on: Reimbursement derives settled_at from its status.
     */
    public function run(): void
    {
        // Sample data is not household activity: keep it out of the history.
        ActivityLog::$enabled = false;
        try {
            $this->seedSampleData();
        } finally {
            ActivityLog::$enabled = true;
        }
    }

    private function seedSampleData(): void
    {
        $this->call(HouseholdMemberSeeder::class);

        Expense::factory(90)->create();
        // Guarantee the current month is never empty, even early in the month.
        Expense::factory(8)
            ->sequence(fn () => ['spent_at' => fake()->dateTimeBetween(now()->startOfMonth(), 'now')->format('Y-m-d')])
            ->create();

        foreach (['groceries' => 3_000_000, 'utilities' => 2_000_000, 'transport' => 1_000_000, 'entertainment' => 750_000] as $category => $amount) {
            Budget::create(['category' => $category, 'amount' => $amount]);
        }

        Reimbursement::factory(4)->create();
        Reimbursement::factory(2)->status(ReimbursementStatus::Approved)->create();
        Reimbursement::factory(5)->status(ReimbursementStatus::Paid)->create();
        Reimbursement::factory()->status(ReimbursementStatus::Rejected)->create();

        collect([
            ['Two-door refrigerator', 7_500_000, 3_200_000, WishlistPriority::High, WishlistStatus::Saving, '+3 months'],
            ['Living room sofa', 5_800_000, 1_000_000, WishlistPriority::Medium, WishlistStatus::Saving, '+6 months'],
            ['Bedroom air purifier', 1_900_000, 0, WishlistPriority::High, WishlistStatus::Wanted, '+2 months'],
            ['Teak bookshelf', 2_400_000, 0, WishlistPriority::Low, WishlistStatus::Wanted, null],
            ['Ceramic cookware set', 1_250_000, 1_250_000, WishlistPriority::Medium, WishlistStatus::Purchased, null],
        ])->each(fn ($row) => WishlistItem::create([
            'name' => $row[0],
            'estimated_price' => $row[1],
            'saved_amount' => $row[2],
            'priority' => $row[3],
            'status' => $row[4],
            'target_date' => $row[5] ? now()->modify($row[5])->toDateString() : null,
        ]));
    }
}
