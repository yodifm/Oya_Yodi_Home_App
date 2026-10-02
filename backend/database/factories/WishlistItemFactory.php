<?php

namespace Database\Factories;

use App\Enums\WishlistPriority;
use App\Enums\WishlistStatus;
use App\Models\WishlistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WishlistItem>
 */
class WishlistItemFactory extends Factory
{
    public function definition(): array
    {
        $price = (int) round(fake()->numberBetween(300_000, 15_000_000) / 10_000) * 10_000;

        return [
            'name' => fake()->randomElement(['Two-door refrigerator', 'Living room sofa', 'Washing machine', 'Bookshelf', 'Air purifier']),
            'estimated_price' => $price,
            'saved_amount' => 0,
            'priority' => fake()->randomElement(WishlistPriority::cases()),
            'status' => WishlistStatus::Wanted,
            'target_date' => fake()->optional(0.7)->dateTimeBetween('now', '+1 year')?->format('Y-m-d'),
            'url' => null,
            'notes' => null,
        ];
    }
}
