<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Enums\WishlistStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\WishlistItem;
use App\Services\BudgetStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    private const TREND_MONTHS = 6;

    public function __invoke(Request $request, BudgetStatus $budgets): JsonResponse
    {
        $filters = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'category' => ['nullable', 'string', Rule::exists('categories', 'key')],
        ]);
        // The category narrows the spending figures, trend and recent list. The
        // by-category breakdown always lists every category so it can act as the picker.
        $category = $filters['category'] ?? null;

        $month = Carbon::createFromFormat('!Y-m', $filters['month'] ?? now()->format('Y-m'));
        $key = $month->format('Y-m');
        $previousKey = $month->copy()->subMonth()->format('Y-m');

        $thisMonth = Expense::inMonth($key)->ofCategory($category);

        return response()->json([
            'month' => $key,
            'category' => $category,
            'spending' => [
                'this_month' => (int) (clone $thisMonth)->sum('amount'),
                'last_month' => (int) Expense::inMonth($previousKey)->ofCategory($category)->sum('amount'),
                'transactions' => (clone $thisMonth)->count(),
            ],
            'by_category' => Expense::inMonth($key)
                ->selectRaw('category, sum(amount) as total')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['category' => $row->category, 'total' => (int) $row->total]),
            'trend' => $this->trend($month, $category),
            'reimbursements' => [
                'pending_total' => (int) Reimbursement::where('status', ReimbursementStatus::Pending)->sum('amount'),
                'pending_count' => Reimbursement::where('status', ReimbursementStatus::Pending)->count(),
                'approved_total' => (int) Reimbursement::where('status', ReimbursementStatus::Approved)->sum('amount'),
            ],
            'wishlist' => $this->wishlist(),
            'budgets' => $budgets->budgetedForMonth($key),
            'recent_expenses' => ExpenseResource::collection(
                Expense::ofCategory($category)->orderByDesc('spent_at')->orderByDesc('id')->limit(5)->get()
            ),
        ]);
    }

    /**
     * Monthly totals ending at $month, zero-filled. Grouped in PHP rather than SQL
     * so the query stays portable across SQLite and MySQL date functions.
     *
     * @return list<array{month: string, total: int}>
     */
    private function trend(Carbon $month, ?string $category): array
    {
        $start = $month->copy()->subMonths(self::TREND_MONTHS - 1)->startOfMonth();

        $totals = Expense::spentBetween($start, $month->copy()->addMonth())
            ->ofCategory($category)
            ->get(['spent_at', 'amount'])
            ->groupBy(fn (Expense $e) => $e->spent_at->format('Y-m'))
            ->map->sum('amount');

        return collect(range(0, self::TREND_MONTHS - 1))
            ->map(function (int $offset) use ($start, $totals) {
                $key = $start->copy()->addMonths($offset)->format('Y-m');

                return ['month' => $key, 'total' => (int) ($totals[$key] ?? 0)];
            })
            ->all();
    }

    /** @return array{remaining_total: int, saved_total: int, open_count: int} */
    private function wishlist(): array
    {
        $open = WishlistItem::where('status', '!=', WishlistStatus::Purchased)->get(['estimated_price', 'saved_amount']);

        return [
            'remaining_total' => $open->sum(fn ($i) => max(0, $i->estimated_price - $i->saved_amount)),
            'saved_total' => $open->sum('saved_amount'),
            'open_count' => $open->count(),
        ];
    }
}
