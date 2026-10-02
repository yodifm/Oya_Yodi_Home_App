<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Category;
use App\Services\BudgetStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function __construct(private BudgetStatus $status) {}

    /** Every active category with its limit (or null) and this month's spending. */
    public function index(Request $request): JsonResponse
    {
        $month = $request->validate(['month' => ['nullable', 'date_format:Y-m']])['month'] ?? now()->format('Y-m');

        return response()->json(['month' => $month, 'data' => $this->status->forMonth($month)]);
    }

    /** Set a category's monthly limit; a null/empty amount removes the budget. */
    public function update(Request $request, string $category): JsonResponse
    {
        abort_unless(Category::active()->where('key', $category)->exists(), 404);
        $amount = $request->validate(['amount' => ['nullable', 'integer', 'min:1']])['amount'] ?? null;

        if ($amount === null) {
            Budget::where('category', $category)->first()?->delete();
        } else {
            Budget::updateOrCreate(['category' => $category], ['amount' => $amount]);
        }

        return response()->json(['category' => $category, 'limit' => $amount]);
    }
}
