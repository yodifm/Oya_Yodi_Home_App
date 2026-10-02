<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Creates (or refreshes) one login per entry in config/household.php.
 * Safe to re-run on its own: php artisan db:seed --class=HouseholdMemberSeeder
 */
class HouseholdMemberSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('household.members') as $member) {
            if (blank($member['password'])) {
                throw new RuntimeException("Password for {$member['email']} is not set in .env (see config/household.php).");
            }

            User::updateOrCreate(
                ['email' => $member['email']],
                ['name' => $member['name'], 'password' => $member['password'], 'email_verified_at' => now()],
            );
        }
    }
}
