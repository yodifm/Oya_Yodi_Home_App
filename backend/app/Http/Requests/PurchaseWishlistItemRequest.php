<?php

namespace App\Http\Requests;

use App\Enums\ExpenseCategory;
use App\Enums\PaymentMethod;
use App\Http\Requests\Concerns\ValidatesPaymentBank;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The expense to record when a wishlist item is bought. */
class PurchaseWishlistItemRequest extends FormRequest
{
    use ValidatesPaymentBank;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1'],
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'spent_at' => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            ...$this->bankRules(),
            'paid_by' => ['required', 'string', Rule::exists('users', 'name')],
        ];
    }
}
