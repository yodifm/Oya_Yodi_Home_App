<?php

namespace App\Models;

use App\Enums\ExpenseCategory;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** A standing monthly spending limit for one category. */
class Budget extends Model
{
    /** @use HasFactory<\Database\Factories\BudgetFactory> */
    use HasFactory, LogsActivity;

    /** The category key; the frontend turns it into its display name. */
    public function activitySummary(): string
    {
        return $this->category->value;
    }

    protected $fillable = ['category', 'amount'];

    protected function casts(): array
    {
        return [
            'category' => ExpenseCategory::class,
            'amount' => 'integer',
        ];
    }
}
