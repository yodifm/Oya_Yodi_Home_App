<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case Groceries = 'groceries';
    // Ready-made food: eating out, delivery, snacks — as opposed to groceries to cook with.
    case Food = 'food';
    case Utilities = 'utilities';
    case Transport = 'transport';
    case Household = 'household';
    case Health = 'health';
    case Education = 'education';
    case Entertainment = 'entertainment';
    case Other = 'other';
}
