<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /** Authenticate as a household member. Both names exist so either can be a payer/claimant. */
    protected function signIn(string $name = 'Yodi'): User
    {
        $yodi = User::factory()->create(['name' => 'Yodi']);
        $oya = User::factory()->create(['name' => 'Oya']);

        $user = $name === 'Oya' ? $oya : $yodi;
        Sanctum::actingAs($user);

        return $user;
    }
}
