<?php

namespace Database\Factories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /** Plausible household line items with a typical rupiah range per default category. */
    private const CATALOG = [
        'groceries' => [['Weekly market run', 'Monthly supermarket shop', 'Fruit & vegetables', 'Rice 10kg', 'Eggs & meat'], 80_000, 900_000],
        'food' => [['Lunch out', 'Food delivery', 'Bakso & es teh', 'Weekend brunch', 'Coffee & snacks'], 25_000, 400_000],
        'utilities' => [['Electricity bill', 'Water bill', 'Home internet', 'Estate service fee', 'Cooking gas'], 50_000, 1_200_000],
        'transport' => [['Car fuel', 'Parking & tolls', 'Motorbike service', 'Ride-hailing'], 20_000, 600_000],
        'household' => [['Soap & detergent', 'LED bulbs', 'Kitchenware', 'Tap repair'], 25_000, 500_000],
        'health' => [['Pharmacy', 'Family vitamins', 'Doctor visit'], 40_000, 750_000],
        'education' => [['School fees', 'Textbooks', 'Language course'], 150_000, 1_500_000],
        'entertainment' => [['Family dinner out', 'Streaming subscription', 'Cinema night'], 50_000, 700_000],
        'other' => [['Donation', 'Birthday gift', 'Miscellaneous'], 30_000, 400_000],
    ];

    /** The default payment methods (see the catalog migration) with their accounts. */
    private const PAYMENTS = [
        'cash' => [],
        'transfer' => ['bca', 'line_bank', 'mandiri'],
        'e-wallet' => [],
    ];

    public function definition(): array
    {
        $category = fake()->randomElement(array_keys(self::CATALOG));
        [$titles, $min, $max] = self::CATALOG[$category];
        $method = fake()->randomElement(array_keys(self::PAYMENTS));

        return [
            'title' => fake()->randomElement($titles),
            'category' => $category,
            // Round to the nearest Rp 500 like real receipts.
            'amount' => (int) round(fake()->numberBetween($min, $max) / 500) * 500,
            'spent_at' => fake()->dateTimeBetween('-5 months', 'now')->format('Y-m-d'),
            'payment_method' => $method,
            'payment_account' => self::PAYMENTS[$method] ? fake()->randomElement(self::PAYMENTS[$method]) : null,
            'paid_by' => fake()->randomElement(['Yodi', 'Oya']),
            'notes' => null,
        ];
    }
}
