<?php

namespace App\Models;

use App\Models\Concerns\IsCatalogItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A bank or e-wallet account under a payment method (BCA under Bank Transfer). */
class PaymentAccount extends Model
{
    use IsCatalogItem;

    protected $fillable = ['payment_method_id'];

    public function siblings(): Builder
    {
        return static::query()->where('payment_method_id', $this->payment_method_id);
    }

    /** @return BelongsTo<PaymentMethod, $this> */
    public function method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
