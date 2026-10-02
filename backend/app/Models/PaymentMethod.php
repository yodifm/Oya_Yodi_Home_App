<?php

namespace App\Models;

use App\Models\Concerns\IsCatalogItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * How an expense was paid (Cash, Bank Transfer, E-Wallet…). A method with
 * accounts asks which one was used; expenses refer to it by key.
 */
class PaymentMethod extends Model
{
    use IsCatalogItem;

    /** @return HasMany<PaymentAccount, $this> */
    public function accounts(): HasMany
    {
        return $this->hasMany(PaymentAccount::class);
    }
}
