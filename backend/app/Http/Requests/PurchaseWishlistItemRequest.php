<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesPayment;
use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The expense to record when a wishlist item is bought. */
class PurchaseWishlistItemRequest extends FormRequest
{
    use ValidatesPayment;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1'],
            'category' => ['required', 'string', Catalog::activeKey('categories')],
            'spent_at' => ['required', 'date', 'before_or_equal:today'],
            ...$this->paymentRules(),
            'paid_by' => ['required', 'string', Rule::exists('users', 'name')],
        ];
    }
}
