<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reimbursement */
class ReimbursementResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'claimant' => $this->claimant,
            'amount' => $this->amount,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at->toDateString(),
            'settled_at' => $this->settled_at?->toDateString(),
            'notes' => $this->notes,
            'has_receipt' => $this->hasReceipt(),
        ];
    }
}
