<?php

namespace App\Enums;

enum WishlistStatus: string
{
    case Wanted = 'wanted';
    case Saving = 'saving';
    case Purchased = 'purchased';
}
