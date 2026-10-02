<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Expense;

/** Budget limit vs. actual spending per category for one month. */
class BudgetStatus
{
    /**
     * Every active category, budgeted or not, in the household's order. A hidden
     * category keeps its budget row, but it is left out until shown again.
     *
     * @return list<array{category: string, limit: int|null, spent: int}>
     */
    public function forMonth(string $month): array
    {
        $limits = Budget::pluck('amount', 'category');
        $spent = Expense::inMonth($month)
            ->selectRaw('category, sum(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        return Category::active()->ordered()->pluck('key')
            ->map(fn (string $key) => [
                'category' => $key,
                'limit' => isset($limits[$key]) ? (int) $limits[$key] : null,
                'spent' => (int) ($spent[$key] ?? 0),
            ])
            ->all();
    }

    /** Only categories that have a limit — what the overview shows. */
    public function budgetedForMonth(string $month): array
    {
        return array_values(array_filter($this->forMonth($month), fn ($row) => $row['limit'] !== null));
    }
}
