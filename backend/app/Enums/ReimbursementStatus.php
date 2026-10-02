<?php

namespace App\Enums;

enum ReimbursementStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Paid = 'paid';
    case Rejected = 'rejected';

    /** A settled claim is closed: it has a settlement date and no longer counts as outstanding. */
    public function isSettled(): bool
    {
        return $this === self::Paid || $this === self::Rejected;
    }
}
