<?php

namespace App\Support;

final class Rupiah
{
    /** 609500 → "Rp 609.500" (same as the app's en-ID formatting). */
    public static function format(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
