<?php

namespace App\Models;

use App\Enums\ReimbursementStatus;
use App\Models\Concerns\HasReceipt;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reimbursement extends Model
{
    /** @use HasFactory<\Database\Factories\ReimbursementFactory> */
    use HasFactory, HasReceipt, LogsActivity;

    public function activitySummary(): string
    {
        return $this->title.' · Rp '.number_format($this->amount, 0, ',', '.');
    }

    /** settled_at follows the status, which is already in the history. */
    protected function activityIgnored(): array
    {
        return ['settled_at'];
    }

    protected $fillable = [
        'title',
        'claimant',
        'amount',
        'status',
        'submitted_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReimbursementStatus::class,
            'amount' => 'integer',
            'submitted_at' => 'date',
            'settled_at' => 'date',
        ];
    }

    protected static function booted(): void
    {
        // settled_at is derived from status, never sent by the client:
        // stamped when a claim is paid or rejected, cleared when it is reopened.
        static::saving(function (Reimbursement $claim) {
            if (! $claim->isDirty('status')) {
                return;
            }

            $claim->settled_at = $claim->status->isSettled() ? now()->toDateString() : null;
        });
    }
}
