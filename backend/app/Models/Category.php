<?php

namespace App\Models;

use App\Models\Concerns\IsCatalogItem;
use Illuminate\Database\Eloquent\Model;

/** An expense category. Expenses and budgets refer to it by key. */
class Category extends Model
{
    use IsCatalogItem;
}
