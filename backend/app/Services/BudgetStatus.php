<?php

namespace App\Services;

use App\Enums\ExpenseCategory;
use App\Models\Budget;
use App\Models\Expense;

/** Budget limit vs. actual spending per category for one month. */
class BudgetStatus
{
    /**
     * Every category, budgeted or not, in enum order.
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

        return collect(ExpenseCategory::cases())
            ->map(fn (ExpenseCategory $c) => [
                'category' => $c->value,
                'limit' => isset($limits[$c->value]) ? (int) $limits[$c->value] : null,
                'spent' => (int) ($spent[$c->value] ?? 0),
            ])
            ->all();
    }

    /** Only categories that have a limit — what the overview shows. */
    public function budgetedForMonth(string $month): array
    {
        return array_values(array_filter($this->forMonth($month), fn ($row) => $row['limit'] !== null));
    }
}
