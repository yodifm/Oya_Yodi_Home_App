<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_full_seeder_runs_on_a_fresh_database(): void
    {
        config(['household.members' => [
            ['name' => 'Yodi', 'email' => 'yodi@example.com', 'password' => 'password123'],
            ['name' => 'Oya', 'email' => 'oya@example.com', 'password' => 'password123'],
        ]]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(2, User::count());
        $this->assertSame(4, Budget::count());
    }
}
