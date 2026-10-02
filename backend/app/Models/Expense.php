<?php

namespace App\Models;

use App\Enums\Bank;
use App\Enums\ExpenseCategory;
use App\Enums\PaymentMethod;
use App\Models\Concerns\HasReceipt;
use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseFactory> */
    use HasFactory, HasReceipt, LogsActivity;

    public function activitySummary(): string
    {
        return $this->title.' · Rp '.number_format($this->amount, 0, ',', '.');
    }

    // receipt_path is set by the app, never mass-assigned from input.
    protected $fillable = [
        'title',
        'category',
        'amount',
        'spent_at',
        'payment_method',
        'bank',
        'paid_by',
        'notes',
    ];

    /**
     * Free-text search plus the month/category filters shared by the list,
     * its pagination summary and the CSV export.
     *
     * @param  array{month?: string|null, year?: string|int|null, category?: string|null, q?: string|null}  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['month'] ?? null, fn (Builder $q, $month) => $q->inMonth($month))
            ->when($filters['year'] ?? null, fn (Builder $q, $year) => $q->spentBetween(
                Carbon::create((int) $year)->startOfYear(),
                Carbon::create((int) $year + 1)->startOfYear(),
            ))
            ->ofCategory($filters['category'] ?? null)
            ->when($filters['q'] ?? null, function (Builder $q, string $term) {
                $like = '%'.addcslashes($term, '%_\\').'%';
                $q->where(fn (Builder $w) => $w->where('title', 'like', $like)
                    ->orWhere('paid_by', 'like', $like)
                    ->orWhere('notes', 'like', $like));
            });
    }

    protected function casts(): array
    {
        return [
            'category' => ExpenseCategory::class,
            'payment_method' => PaymentMethod::class,
            'bank' => Bank::class,
            'amount' => 'integer',
            'spent_at' => 'date',
        ];
    }

    /** Limit to a calendar month given as "YYYY-MM". */
    public function scopeInMonth(Builder $query, string $month): Builder
    {
        $start = Carbon::createFromFormat('!Y-m', $month);

        return $query->spentBetween($start, $start->copy()->addMonth());
    }

    /** Limit to one category; a null category means "all" and leaves the query untouched. */
    public function scopeOfCategory(Builder $query, ?string $category): Builder
    {
        return $query->when($category, fn (Builder $q) => $q->where('category', $category));
    }

    /**
     * Half-open range [from, until). Dates are stored with a time part
     * ("2026-03-31 00:00:00"), so an inclusive end date would drop the last day.
     */
    public function scopeSpentBetween(Builder $query, Carbon $from, Carbon $until): Builder
    {
        return $query
            ->where('spent_at', '>=', $from->toDateString())
            ->where('spent_at', '<', $until->toDateString());
    }
}
