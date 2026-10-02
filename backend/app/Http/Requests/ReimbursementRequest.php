<?php

namespace App\Http\Requests;

use App\Enums\ReimbursementStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReimbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'claimant' => ['required', 'string', Rule::exists('users', 'name')],
            'amount' => ['required', 'integer', 'min:1'],
            'status' => ['required', Rule::enum(ReimbursementStatus::class)],
            'submitted_at' => ['required', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
