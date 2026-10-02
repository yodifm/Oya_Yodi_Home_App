<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            // Names are what expenses and claims point at, so they must be unique.
            'name' => ['required', 'string', 'max:64', Rule::unique('users', 'name')->ignore($user)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            // Required when creating; optional when editing (blank = keep current password).
            'password' => [$user ? 'nullable' : 'required', 'confirmed', Password::min(8)],
            // Household email updates for this person; on by default.
            'email_notifications' => ['sometimes', 'boolean'],
        ];
    }
}
