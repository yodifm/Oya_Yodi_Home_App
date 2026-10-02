<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One entry in the household's change history. Append-only. */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    /**
     * One switch for every model using LogsActivity (a static on the trait would
     * be copied per model). Off while seeding so sample data doesn't flood the history.
     */
    public static bool $enabled = true;

    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'summary', 'changes'];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
