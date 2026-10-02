<?php

namespace App\Support;

use App\Models\Category;
use App\Models\PaymentAccount;
use App\Models\PaymentMethod;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Exists;

/**
 * Display names and validation for the household-managed lists. Records store
 * keys; names come from here (archived items included, so history still reads
 * right), loaded once per request.
 */
final class Catalog
{
    public static function category(string $key): string
    {
        return self::names(Category::class)[$key] ?? Str::headline($key);
    }

    /** "Cash", or "Bank Transfer · BCA" when an account was used. */
    public static function payment(string $method, ?string $account): string
    {
        $name = self::names(PaymentMethod::class)[$method] ?? Str::headline($method);

        return $account ? $name.' · '.self::account($account) : $name;
    }

    public static function account(string $key): string
    {
        return self::names(PaymentAccount::class)[$key] ?? Str::headline($key);
    }

    /**
     * The key must name an active item — or be the record's current value, so
     * editing an old expense doesn't force it off a category hidden since.
     */
    public static function activeKey(string $table, ?string $current = null): Exists
    {
        return (new Exists($table, 'key'))->where(
            fn ($q) => $q->whereNull('archived_at')->when($current, fn ($q) => $q->orWhere('key', $current)),
        );
    }

    /**
     * @param  class-string<Category|PaymentMethod|PaymentAccount>  $model
     * @return array<string, string>
     */
    private static function names(string $model): array
    {
        return once(fn () => $model::pluck('name', 'key')->all());
    }
}
