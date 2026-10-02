<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReimbursementRequest;
use App\Http\Resources\ReimbursementResource;
use App\Models\Reimbursement;
use App\Services\HouseholdNotifier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ReimbursementController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(ReimbursementStatus::class)],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $page = Reimbursement::query()
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return ReimbursementResource::collection($page)->additional(['summary' => $this->summary()]);
    }

    public function store(ReimbursementRequest $request, HouseholdNotifier $notify): ReimbursementResource
    {
        $claim = Reimbursement::create($request->validated());
        $notify->claimSubmitted($claim, $request->user());

        return new ReimbursementResource($claim);
    }

    public function show(Reimbursement $reimbursement): ReimbursementResource
    {
        return new ReimbursementResource($reimbursement);
    }

    public function update(ReimbursementRequest $request, Reimbursement $reimbursement, HouseholdNotifier $notify): ReimbursementResource
    {
        $previousStatus = $reimbursement->status;
        $reimbursement->update($request->validated());

        if ($reimbursement->status !== $previousStatus) {
            $notify->claimStatusChanged($reimbursement, $request->user(), $previousStatus);
        }

        return new ReimbursementResource($reimbursement);
    }

    public function destroy(Reimbursement $reimbursement): Response
    {
        $reimbursement->delete();

        return response()->noContent();
    }

    /**
     * Count and total per status across all claims — drives the tab counts and
     * summary cards regardless of which page or tab is showing.
     *
     * @return array<string, array{count: int, total: int}>
     */
    private function summary(): array
    {
        $rows = Reimbursement::selectRaw('status, count(*) as count, sum(amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy(fn ($row) => $row->status->value);

        return collect(ReimbursementStatus::cases())
            ->mapWithKeys(fn (ReimbursementStatus $s) => [$s->value => [
                'count' => (int) ($rows[$s->value]->count ?? 0),
                'total' => (int) ($rows[$s->value]->total ?? 0),
            ]])
            ->all();
    }
}
