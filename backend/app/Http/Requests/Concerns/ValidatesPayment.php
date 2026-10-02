<?php

namespace App\Http\Requests\Concerns;

use App\Models\Expense;
use App\Models\PaymentMethod;
use App\Support\Catalog;
use Illuminate\Validation\Rule;

/**
 * The payment method, plus which of its accounts was used when the method has
 * any (a bank for Bank Transfer). For a method without accounts the account is
 * cleared, so switching an expense to Cash drops a stale bank instead of
 * rejecting the request.
 */
trait ValidatesPayment
{
    private ?PaymentMethod $paymentMethod = null;

    private bool $methodHasAccounts = false;

    protected function prepareForValidation(): void
    {
        $this->paymentMethod = PaymentMethod::where('key', (string) $this->input('payment_method'))->first();
        $this->methodHasAccounts = (bool) $this->paymentMethod?->accounts()->active()->exists();

        if (! $this->methodHasAccounts) {
            $this->merge(['payment_account' => null]);
        }
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['payment_account.required' => 'Choose which account paid.'];
    }

    /**
     * @param  Expense|null  $current  the expense being edited, whose current choices stay valid
     * @return array<string, mixed>
     */
    protected function paymentRules(?Expense $current = null): array
    {
        return [
            'payment_method' => ['required', 'string', Catalog::activeKey('payment_methods', $current?->payment_method)],
            'payment_account' => [
                'nullable',
                Rule::requiredIf(fn () => $this->methodHasAccounts),
                'string',
                Catalog::activeKey('payment_accounts', $current?->payment_account)
                    ->where('payment_method_id', $this->paymentMethod?->id ?? 0),
            ],
        ];
    }
}
