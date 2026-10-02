<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesPayment;
use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
{
    use ValidatesPayment;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $current = $this->route('expense');

        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Catalog::activeKey('categories', $current?->category)],
            'amount' => ['required', 'integer', 'min:1'],
            'spent_at' => ['required', 'date', 'before_or_equal:today'],
            ...$this->paymentRules($current),
            'paid_by' => ['required', 'string', Rule::exists('users', 'name')],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
