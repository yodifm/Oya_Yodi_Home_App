<?php

namespace App\Http\Requests;

use App\Enums\WishlistPriority;
use App\Enums\WishlistStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WishlistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'estimated_price' => ['required', 'integer', 'min:1'],
            'saved_amount' => ['required', 'integer', 'min:0', 'lte:estimated_price'],
            'priority' => ['required', Rule::enum(WishlistPriority::class)],
            'status' => ['required', Rule::enum(WishlistStatus::class)],
            'target_date' => ['nullable', 'date'],
            'url' => ['nullable', 'url:http,https', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
