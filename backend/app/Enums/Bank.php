<?php

namespace App\Enums;

/** The household's bank accounts, used when an expense is paid by bank transfer. */
enum Bank: string
{
    case Bca = 'bca';
    case LineBank = 'line_bank';
    case Mandiri = 'mandiri';
}
