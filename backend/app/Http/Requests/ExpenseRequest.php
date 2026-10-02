<?php

namespace App\Http\Requests;

use App\Enums\ExpenseCategory;
use App\Enums\PaymentMethod;
use App\Http\Requests\Concerns\ValidatesPaymentBank;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::enum(ExpenseCategory::class)],
            'amount' => ['required', 'integer', 'min:1'],
            'spent_at' => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            ...$this->bankRules(),
            'paid_by' => ['required', 'string', Rule::exists('users', 'name')],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
