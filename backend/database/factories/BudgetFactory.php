<?php

namespace Database\Factories;

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
            'category' => fake()->randomElement(['groceries', 'food', 'utilities', 'transport', 'household', 'health', 'education', 'entertainment', 'other']),
            'amount' => fake()->numberBetween(5, 40) * 100_000,
        ];
    }
}
