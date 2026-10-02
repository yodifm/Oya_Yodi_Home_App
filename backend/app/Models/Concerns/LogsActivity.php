<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;
use BackedEnum;
use DateTimeInterface;
use Illuminate\Support\Facades\Auth;

/**
 * Records created / updated / deleted events of a model in activity_logs,
 * attributed to the signed-in user. Updates store only the fields that
 * actually changed, as { field: [old, new] }.
 *
 * Models provide activitySummary() — a readable label kept with the entry so
 * it still makes sense after the record is gone.
 */
trait LogsActivity
{
    /** Bookkeeping columns that never appear in the history. */
    private static array $activityAlwaysIgnored = ['created_at', 'updated_at', 'remember_token', 'email_verified_at'];

    protected static function bootLogsActivity(): void
    {
        static::created(fn (self $model) => $model->writeActivity('created'));
        static::deleted(fn (self $model) => $model->writeActivity('deleted'));
        static::updated(function (self $model) {
            $changes = $model->activityChanges();
            if ($changes) {
                $model->writeActivity('updated', $changes);
            }
        });
    }

    abstract public function activitySummary(): string;

    /** Short type key stored with each entry, e.g. "expense". */
    public function activityType(): string
    {
        return str(class_basename($this))->snake()->toString();
    }

    /** Model-specific columns to leave out of the history (derived or internal). */
    protected function activityIgnored(): array
    {
        return [];
    }

    /** @return array<string, array{0: mixed, 1: mixed}|null> */
    public function activityChanges(): array
    {
        $ignored = [...self::$activityAlwaysIgnored, ...$this->activityIgnored()];
        $changes = [];

        foreach (array_keys($this->getChanges()) as $key) {
            if (in_array($key, $ignored, true)) {
                continue;
            }

            if ($key === 'password') {
                $changes['password'] = null; // that it changed, never the value
            } elseif ($key === 'receipt_path') {
                $changes['receipt'] = [$this->getOriginal('receipt_path') !== null, $this->receipt_path !== null];
            } else {
                $changes[$key] = [self::activityValue($this->getOriginal($key)), self::activityValue($this->getAttribute($key))];
            }
        }

        return $changes;
    }

    private function writeActivity(string $action, ?array $changes = null): void
    {
        if (! ActivityLog::$enabled) {
            return;
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'subject_type' => $this->activityType(),
            'subject_id' => $this->getKey(),
            'summary' => mb_strimwidth($this->activitySummary(), 0, 255, '…'),
            'changes' => $changes,
        ]);
    }

    private static function activityValue(mixed $value): mixed
    {
        return match (true) {
            $value instanceof BackedEnum => $value->value,
            $value instanceof DateTimeInterface => $value->format('Y-m-d'),
            default => $value,
        };
    }
}
