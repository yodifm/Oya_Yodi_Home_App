<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => User::orderBy('id')->get()->map(fn (User $u) => $this->present($u)),
        ]);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return response()->json(['data' => $this->present($user)], 201);
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        DB::transaction(function () use ($user, $data, $request) {
            $oldName = $user->name;
            $user->update($data);

            // Expenses and claims reference members by name: carry a rename through.
            if ($user->wasChanged('name')) {
                Expense::where('paid_by', $oldName)->update(['paid_by' => $user->name]);
                Reimbursement::where('claimant', $oldName)->update(['claimant' => $user->name]);            }

            // A new password signs the account out everywhere else.
            if ($user->wasChanged('password')) {
                $current = $request->user()->currentAccessToken();
                $user->tokens()
                    ->when($current instanceof PersonalAccessToken, fn ($q) => $q->whereKeyNot($current->getKey()))
                    ->delete();
            }
        });

        return response()->json(['data' => $this->present($user->fresh())]);
    }

    public function destroy(Request $request, User $user): Response
    {
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages(['user' => 'You cannot delete the account you are signed in with.']);
        }

        ['expenses' => $expenses, 'claims' => $claims] = $this->usage($user);
        if ($expenses || $claims) {
            throw ValidationException::withMessages([
                'user' => "{$user->name} still has {$expenses} expenses and {$claims} reimbursement claims. Reassign or delete those first.",
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }

    /** @return array{expenses: int, claims: int} */
    private function usage(User $user): array
    {
        return [
            'expenses' => Expense::where('paid_by', $user->name)->count(),
            'claims' => Reimbursement::where('claimant', $user->name)->count(),        ];
    }

    /** @return array<string, mixed> */
    private function present(User $user): array
    {
        $usage = $this->usage($user);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_notifications' => (bool) $user->email_notifications,
            'created_at' => $user->created_at?->toDateString(),
            'expenses_count' => $usage['expenses'],
            'claims_count' => $usage['claims'],        ];
    }
}
