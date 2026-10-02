<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WishlistItem */
class WishlistItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'estimated_price' => $this->estimated_price,
            'saved_amount' => $this->saved_amount,
            'priority' => $this->priority,
            'status' => $this->status,
            'target_date' => $this->target_date?->toDateString(),
            'url' => $this->url,
            'notes' => $this->notes,
            'expense_id' => $this->expense_id,
            'created_by' => $this->creator?->name,
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
