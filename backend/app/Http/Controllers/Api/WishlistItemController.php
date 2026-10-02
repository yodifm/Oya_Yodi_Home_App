<?php

namespace App\Http\Controllers\Api;

use App\Enums\WishlistStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseWishlistItemRequest;
use App\Http\Requests\WishlistItemRequest;
use App\Models\Expense;
use App\Services\HouseholdNotifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class WishlistItemController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(WishlistStatus::class)],
        ]);

        $items = WishlistItem::query()
            ->with('creator:id,name')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            // Purchased items sink to the bottom; open items sort by priority.
            ->orderByRaw("case status when 'purchased' then 1 else 0 end")
            ->orderByRaw("case priority when 'high' then 0 when 'medium' then 1 else 2 end")
            ->orderBy('target_date')
            ->get();

        return WishlistItemResource::collection($items);
    }

    public function store(WishlistItemRequest $request): WishlistItemResource
    {
        $item = new WishlistItem($request->validated());
        $item->created_by_id = $request->user()->id;
        $item->save();

        return new WishlistItemResource($item->load('creator:id,name'));
    }

    public function show(WishlistItem $wishlistItem): WishlistItemResource
    {
        return new WishlistItemResource($wishlistItem);
    }

    public function update(WishlistItemRequest $request, WishlistItem $wishlistItem): WishlistItemResource
    {
        $wishlistItem->fill($request->validated());

        // Reopening a wish detaches it from its purchase so it can be bought again
        // later. The recorded expense itself stays in the book.
        if ($wishlistItem->status !== WishlistStatus::Purchased) {
            $wishlistItem->expense_id = null;
        }

        $wishlistItem->save();

        return new WishlistItemResource($wishlistItem);
    }

    /** Mark as purchased and record the purchase as an expense, in one step. */
    public function purchase(PurchaseWishlistItemRequest $request, WishlistItem $wishlistItem, HouseholdNotifier $notify): WishlistItemResource
    {
        if ($wishlistItem->expense_id) {
            throw ValidationException::withMessages(['item' => 'This item already has a purchase recorded.']);
        }

        $expense = DB::transaction(function () use ($request, $wishlistItem) {
            $expense = Expense::create([...$request->validated(), 'title' => $wishlistItem->name, 'notes' => 'From the wishlist']);

            $wishlistItem->status = WishlistStatus::Purchased;
            $wishlistItem->saved_amount = min($wishlistItem->estimated_price, max($wishlistItem->saved_amount, $expense->amount));
            $wishlistItem->expense_id = $expense->id;
            $wishlistItem->save();

            return $expense;
        });

        // After commit: never email about a purchase that rolled back.
        $notify->expenseRecorded($expense, $request->user());

        return new WishlistItemResource($wishlistItem);
    }

    public function destroy(WishlistItem $wishlistItem): Response
    {
        $wishlistItem->delete();

        return response()->noContent();
    }
}
