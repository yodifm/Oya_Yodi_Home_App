<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'amount' => $this->amount,
            'spent_at' => $this->spent_at->toDateString(),
            'payment_method' => $this->payment_method,
            'payment_account' => $this->payment_account,
            'paid_by' => $this->paid_by,
            'notes' => $this->notes,
            'has_receipt' => $this->hasReceipt(),
        ];
    }
}
