<?php

namespace Database\Factories;

use App\Enums\ExpenseCategory;
use App\Models\Budget;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category' => fake()->randomElement(ExpenseCategory::cases()),
            'amount' => fake()->numberBetween(5, 40) * 100_000,
        ];
    }
}
