<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/** Year-at-a-glance numbers for the Reports page. */
class ReportController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $year = (int) ($filters['year'] ?? now()->year);
        $start = Carbon::create($year)->startOfYear();
        $lastMonth = $year === now()->year ? now()->month : 12;

        $expenses = Expense::spentBetween($start, $start->copy()->addYear())->get(['spent_at', 'amount', 'category']);
        $total = (int) $expenses->sum('amount');

        // Average over the months actually being tracked: from the first recorded
        // month to now. Months before the book was started would understate it.
        $firstMonth = $expenses->min(fn ($e) => $e->spent_at->month) ?? $lastMonth;
        $elapsed = max(1, $lastMonth - $firstMonth + 1);

        $months = collect(range(1, 12))->map(function (int $m) use ($expenses, $year) {
            $key = sprintf('%d-%02d', $year, $m);

            return [
                'month' => $key,
                'total' => (int) $expenses->filter(fn ($e) => $e->spent_at->format('Y-m') === $key)->sum('amount'),
            ];
        });

        // Compare a month with the one before it, per category (default: latest elapsed month).
        $focus = Carbon::createFromFormat('!Y-m', $filters['month'] ?? sprintf('%d-%02d', $year, $lastMonth));

        return response()->json([
            'year' => $year,
            'total' => $total,
            'previous_year_total' => (int) Expense::spentBetween($start->copy()->subYear(), $start)->sum('amount'),
            'average_per_month' => $elapsed ? intdiv($total, $elapsed) : 0,
            'months_elapsed' => $elapsed,
            'highest_month' => $months->sortByDesc('total')->first(fn ($m) => $m['total'] > 0),
            'months' => $months->values(),
            'by_category' => $this->byCategory($expenses, $total),
            'changes' => [
                'month' => $focus->format('Y-m'),
                'previous_month' => $focus->copy()->subMonth()->format('Y-m'),
                'rows' => $this->changes($focus),
            ],
        ]);
    }

    /** @return list<array{category: string, total: int, share: float}> */
    private function byCategory(Collection $expenses, int $total): array
    {
        return $expenses->groupBy('category')
            ->map(fn (Collection $rows, string $category) => [
                'category' => $category,
                'total' => (int) $rows->sum('amount'),
                'share' => $total ? round($rows->sum('amount') / $total * 100, 1) : 0.0,
            ])
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * Per-category change from the previous month, biggest increase first.
     *
     * @return list<array{category: string, current: int, previous: int, change: int}>
     */
    private function changes(Carbon $month): array
    {
        $totals = fn (string $m) => Expense::inMonth($m)
            ->selectRaw('category, sum(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $current = $totals($month->format('Y-m'));
        $previous = $totals($month->copy()->subMonth()->format('Y-m'));

        return $current->keys()->merge($previous->keys())->unique()
            ->map(fn ($c) => [
                'category' => $c,
                'current' => (int) ($current[$c] ?? 0),
                'previous' => (int) ($previous[$c] ?? 0),
                'change' => (int) ($current[$c] ?? 0) - (int) ($previous[$c] ?? 0),
            ])
            ->sortByDesc('change')
            ->values()
            ->all();
    }
}
