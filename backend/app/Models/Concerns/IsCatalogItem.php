<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * Shared by the household-managed lists (categories, payment methods, payment
 * accounts): a stable key that records point at, a display name that can be
 * renamed freely, a manual order, and archiving instead of deleting once used.
 */
trait IsCatalogItem
{
    use LogsActivity;

    protected static function bootIsCatalogItem(): void
    {
        static::creating(function (self $item) {
            $item->key ??= static::uniqueKey($item->name);
            $item->position ??= (int) $item->siblings()->max('position') + 1;
        });
    }

    public function initializeIsCatalogItem(): void
    {
        $this->mergeFillable(['name', 'position', 'archived_at']);
        $this->mergeCasts(['archived_at' => 'datetime', 'position' => 'integer']);
    }

    public function activitySummary(): string
    {
        return $this->name;
    }

    /** Reordering is not worth a history entry. */
    protected function activityIgnored(): array
    {
        return ['position'];
    }

    /** The items this one is ordered among; accounts narrow it to their method. */
    public function siblings(): Builder
    {
        return static::query();
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position')->orderBy('id');
    }

    /** "Credit Card" → "credit_card", "credit_card_2" if taken. Never changes after creation. */
    private static function uniqueKey(string $name): string
    {
        $base = Str::limit(Str::slug($name, '_'), 28, '') ?: 'item';
        $key = $base;
        for ($n = 2; static::query()->where('key', $key)->exists(); $n++) {
            $key = "{$base}_{$n}";
        }

        return $key;
    }
}
