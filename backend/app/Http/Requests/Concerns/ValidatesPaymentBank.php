<?php

namespace App\Http\Requests\Concerns;

use App\Enums\Bank;
use App\Enums\PaymentMethod;
use Illuminate\Validation\Rule;

/**
 * A bank is required for bank transfers and meaningless otherwise, so it is
 * cleared for cash/e-wallet — switching an expense away from transfer drops
 * the stale bank instead of rejecting the request.
 */
trait ValidatesPaymentBank
{
    protected function prepareForValidation(): void
    {
        if ($this->input('payment_method') !== PaymentMethod::Transfer->value) {
            $this->merge(['bank' => null]);
        }
    }

    /** @return array<string, mixed> */
    protected function bankRules(): array
    {
        return [
            'bank' => ['nullable', 'required_if:payment_method,'.PaymentMethod::Transfer->value, Rule::enum(Bank::class)],
        ];
    }
}
