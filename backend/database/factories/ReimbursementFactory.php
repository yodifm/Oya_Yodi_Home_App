<?php

namespace Database\Factories;

use App\Enums\ReimbursementStatus;
use App\Models\Reimbursement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reimbursement>
 */
class ReimbursementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->randomElement([
                'Covered the grocery run',
                'Paid the electricity bill',
                'Medicine for Grandma',
                'Fuel for the family trip',
                'Neighbourhood dues',
            ]),
            'claimant' => fake()->randomElement(['Yodi', 'Oya']),
            'amount' => (int) round(fake()->numberBetween(50_000, 1_500_000) / 1000) * 1000,
            'status' => ReimbursementStatus::Pending,
            'submitted_at' => fake()->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
            'notes' => null,
        ];
    }

    public function status(ReimbursementStatus $status): static
    {
        return $this->state(['status' => $status]);
    }
}
