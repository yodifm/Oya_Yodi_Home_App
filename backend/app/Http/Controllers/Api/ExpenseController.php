<?php

namespace App\Http\Controllers\Api;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\HouseholdNotifier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $this->filters($request);
        $perPage = (int) ($request->validate(['per_page' => ['nullable', 'integer', 'min:5', 'max:100']])['per_page'] ?? 20);

        $query = Expense::filter($filters);

        $page = (clone $query)
            ->orderByDesc('spent_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        // Totals cover every matching row, not just the visible page.
        return ExpenseResource::collection($page)->additional(['summary' => [
            'count' => $page->total(),
            'total_amount' => (int) $query->sum('amount'),
        ]]);
    }

    /** CSV of the filtered expenses, ready to open in Excel. */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $suffix = $filters['month'] ?? $filters['year'] ?? 'all';

        return response()->streamDownload(function () use ($filters) {
            $out = fopen('php://output', 'w');
            // BOM so Excel reads UTF-8; "sep=," so Excel splits columns even in locales that use ";".
            fwrite($out, "\xEF\xBB\xBFsep=,\n");
            fputcsv($out, ['Date', 'Description', 'Category', 'Amount (IDR)', 'Payment method', 'Bank', 'Paid by', 'Notes']);

            Expense::filter($filters)->orderBy('spent_at')->orderBy('id')
                ->lazy()
                ->each(fn (Expense $e) => fputcsv($out, [
                    $e->spent_at->toDateString(),
                    $e->title,
                    $e->category->value,
                    $e->amount,
                    $e->payment_method->value,
                    $e->bank?->value,
                    $e->paid_by,
                    $e->notes,
                ]));

            fclose($out);
        }, "expenses-{$suffix}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function store(ExpenseRequest $request, HouseholdNotifier $notify): ExpenseResource
    {
        $expense = Expense::create($request->validated());
        $notify->expenseRecorded($expense, $request->user());

        return new ExpenseResource($expense);
    }

    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($expense);
    }

    public function update(ExpenseRequest $request, Expense $expense, HouseholdNotifier $notify): ExpenseResource
    {
        // What this expense counted towards its category+month *before* the edit,
        // so the budget check can tell whether this edit is what crossed the limit.
        $before = ['category' => $expense->category, 'month' => $expense->spent_at->format('Y-m'), 'amount' => $expense->amount];

        $expense->update($request->validated());

        $sameBucket = $before['category'] === $expense->category && $before['month'] === $expense->spent_at->format('Y-m');
        $notify->expenseUpdated($expense, $request->user(), $sameBucket ? $before['amount'] : 0);

        return new ExpenseResource($expense);
    }

    public function destroy(Expense $expense): Response
    {
        $expense->delete();

        return response()->noContent();
    }

    /** @return array{month?: string|null, year?: string|null, category?: string|null, q?: string|null} */
    private function filters(Request $request): array
    {
        return $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'category' => ['nullable', Rule::enum(ExpenseCategory::class)],
            'q' => ['nullable', 'string', 'max:100'],
        ]);
    }
}
