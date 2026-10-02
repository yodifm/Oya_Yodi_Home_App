<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Expense;
use App\Models\PaymentAccount;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The "Categories & Payments" page: the household's categories, payment
 * methods and each method's accounts. One controller serves all three lists,
 * picked by the route's {list} default.
 *
 * An item that records already use is hidden (archived) rather than deleted,
 * so past expenses, budgets and reports keep their names.
 */
class CatalogController extends Controller
{
    /** list => [model, the expenses column that refers to it, what it is called in messages] */
    private const LISTS = [
        'category' => [Category::class, 'category', 'category'],
        'method' => [PaymentMethod::class, 'payment_method', 'payment method'],
        'account' => [PaymentAccount::class, 'payment_account', 'account'],
    ];

    /** Everything, hidden items included (marked), in the household's order, with usage counts. */
    public function index(): JsonResponse
    {
        $categoryUsage = $this->usage('category');
        $methodUsage = $this->usage('payment_method');
        $accountUsage = $this->usage('payment_account');

        return response()->json([
            'categories' => Category::ordered()->get()->map(fn (Category $c) => $this->present($c, $categoryUsage)),
            'payment_methods' => PaymentMethod::ordered()
                ->with(['accounts' => fn ($q) => $q->ordered()])
                ->get()
                ->map(fn (PaymentMethod $m) => [
                    ...$this->present($m, $methodUsage),
                    'accounts' => $m->accounts->map(fn (PaymentAccount $a) => $this->present($a, $accountUsage))->values(),
                ]),
        ]);
    }

    public function store(Request $request, ?PaymentMethod $paymentMethod = null): JsonResponse
    {
        $list = $this->list($request);
        [$model] = self::LISTS[$list];
        $name = $request->validate(['name' => $this->nameRules($list, $paymentMethod?->id)], $this->messages($list))['name'];

        $item = new $model(['name' => $name]);
        if ($paymentMethod) {
            $item->payment_method_id = $paymentMethod->id;
        }
        $item->save();

        return response()->json(['data' => $this->present($item->refresh(), collect())], 201);
    }

    /** Rename, and/or hide (archived: true) or show again (archived: false). */
    public function update(Request $request): JsonResponse
    {
        $list = $this->list($request);
        $item = $this->find($list, $request);
        $data = $request->validate([
            'name' => ['sometimes', ...$this->nameRules($list, $item->payment_method_id ?? null, $item->id)],
            'archived' => ['sometimes', 'boolean'],
        ], $this->messages($list));

        if (($data['archived'] ?? false) && ! $item->isArchived()) {
            $this->ensureNotLastActive($list, $item);
        }

        $item->fill(['name' => $data['name'] ?? $item->name]);
        if (array_key_exists('archived', $data)) {
            $item->archived_at = $data['archived'] ? ($item->archived_at ?? now()) : null;
        }
        $item->save();

        return response()->json(['data' => $this->present($item, $this->usage(self::LISTS[$list][1]))]);
    }

    /** Delete an unused item; one that records use is hidden instead. */
    public function destroy(Request $request): JsonResponse
    {
        $list = $this->list($request);
        $item = $this->find($list, $request);
        [, $column] = self::LISTS[$list];

        if (! $item->isArchived()) {
            $this->ensureNotLastActive($list, $item);
        }

        if (Expense::where($column, $item->key)->exists()) {
            $item->update(['archived_at' => $item->archived_at ?? now()]);

            return response()->json(['result' => 'archived']);
        }

        if ($list === 'category') {
            Budget::where('category', $item->key)->first()?->delete();
        }
        $item->delete();

        return response()->json(['result' => 'deleted']);
    }

    /** Save a new order: {ids: [3, 1, 2]}, every item of the list (or of one method's accounts). */
    public function reorder(Request $request, ?PaymentMethod $paymentMethod = null): JsonResponse
    {
        $list = $this->list($request);
        $siblings = $this->query($list, $paymentMethod);
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct', Rule::in((clone $siblings)->pluck('id'))],
        ])['ids'];

        foreach ($ids as $index => $id) {
            (clone $siblings)->whereKey($id)->first()?->update(['position' => $index + 1]);
        }

        return response()->json(['ids' => $ids]);
    }

    private function query(string $list, ?PaymentMethod $paymentMethod = null): Builder
    {
        [$model] = self::LISTS[$list];

        return $model::query()->when($paymentMethod, fn ($q) => $q->where('payment_method_id', $paymentMethod->id));
    }

    /** Which list the route serves (route defaults are passed by position, so read them by name). */
    private function list(Request $request): string
    {
        return $request->route('list');
    }

    private function find(string $list, Request $request): Model
    {
        return $this->query($list)->findOrFail((int) $request->route('id'));
    }

    /** @return list<mixed> */
    private function nameRules(string $list, ?int $methodId, ?int $ignoreId = null): array
    {
        [$model] = self::LISTS[$list];
        $unique = Rule::unique((new $model)->getTable(), 'name')->ignore($ignoreId);
        if ($list === 'account') {
            $unique->where('payment_method_id', $methodId);
        }

        return ['required', 'string', 'max:40', $unique];
    }

    /** @return array<string, string> */
    private function messages(string $list): array
    {
        $label = self::LISTS[$list][2];

        return [
            'name.required' => "Give the {$label} a name.",
            'name.unique' => '“:input” is already on the list.',
            'name.max' => 'Keep the name to :max characters.',
        ];
    }

    /** At least one category and one payment method must stay selectable. */
    private function ensureNotLastActive(string $list, Model $item): void
    {
        if ($list === 'account') {
            return;
        }

        [$model, , $label] = self::LISTS[$list];
        if ($model::active()->whereKeyNot($item->id)->doesntExist()) {
            throw ValidationException::withMessages(['name' => "Keep at least one {$label}."]);
        }
    }

    /** @return Collection<string, int> key => number of expenses using it */
    private function usage(string $column): Collection
    {
        return Expense::query()
            ->whereNotNull($column)
            ->selectRaw("{$column} as item_key, count(*) as uses")
            ->groupBy($column)
            ->pluck('uses', 'item_key');
    }

    /** @return array{id: int, key: string, name: string, archived: bool, usage: int} */
    private function present(Model $item, Collection $usage): array
    {
        return [
            'id' => $item->id,
            'key' => $item->key,
            'name' => $item->name,
            'archived' => $item->isArchived(),
            'usage' => (int) ($usage[$item->key] ?? 0),
        ];
    }
}
