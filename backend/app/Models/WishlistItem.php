<?php

namespace App\Models;

use App\Enums\WishlistPriority;
use App\Enums\WishlistStatus;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistItem extends Model
{
    /** The expense recorded when this item was purchased. */
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    /** Who added the wish; set from the signed-in user, never from input. */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /** @use HasFactory<\Database\Factories\WishlistItemFactory> */
    use HasFactory, LogsActivity;

    public function activitySummary(): string
    {
        return $this->name;
    }

    /** Links set by the app itself; the purchase shows up as its own expense entry. */
    protected function activityIgnored(): array
    {
        return ['expense_id', 'created_by_id'];
    }

    protected $fillable = [
        'name',
        'estimated_price',
        'saved_amount',
        'priority',
        'status',
        'target_date',
        'url',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'priority' => WishlistPriority::class,
            'status' => WishlistStatus::class,
            'estimated_price' => 'integer',
            'saved_amount' => 'integer',
            'target_date' => 'date',
        ];
    }
}
