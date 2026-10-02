<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\HouseholdMemberSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_endpoints_reject_guests(): void
    {
        foreach (['/api/dashboard', '/api/expenses', '/api/reimbursements', '/api/wishlist', '/api/me', '/api/members'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        // Even without an Accept header the API answers JSON, never a redirect.
        $this->get('/api/expenses')->assertUnauthorized()->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_login_returns_a_working_token(): void
    {
        User::factory()->create(['name' => 'Oya', 'email' => 'oya@example.com', 'password' => 'rahasia-123']);

        $token = $this->postJson('/api/login', ['email' => 'oya@example.com', 'password' => 'rahasia-123'])
            ->assertOk()
            ->assertJsonPath('user.name', 'Oya')
            ->json('token');

        $this->withToken($token)->getJson('/api/me')->assertOk()->assertJsonPath('user.email', 'oya@example.com');
    }

    public function test_wrong_password_and_unknown_email_get_the_same_error(): void
    {
        User::factory()->create(['email' => 'oya@example.com', 'password' => 'rahasia-123']);

        $wrong = $this->postJson('/api/login', ['email' => 'oya@example.com', 'password' => 'salah'])
            ->assertUnprocessable()->json('errors.email.0');
        $unknown = $this->postJson('/api/login', ['email' => 'siapa@example.com', 'password' => 'salah'])
            ->assertUnprocessable()->json('errors.email.0');

        $this->assertSame('Incorrect email or password.', $wrong);
        $this->assertSame($wrong, $unknown);
    }

    public function test_login_is_rate_limited(): void
    {
        foreach (range(1, 5) as $_) {
            $this->postJson('/api/login', ['email' => 'x@example.com', 'password' => 'x']);
        }

        $this->postJson('/api/login', ['email' => 'x@example.com', 'password' => 'x'])->assertTooManyRequests();
    }

    public function test_logout_revokes_the_token(): void
    {
        User::factory()->create(['email' => 'yodi@example.com', 'password' => 'rahasia-123']);
        $token = $this->postJson('/api/login', ['email' => 'yodi@example.com', 'password' => 'rahasia-123'])->json('token');

        $this->withToken($token)->postJson('/api/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_members_lists_household_accounts(): void
    {
        $this->signIn();

        $this->getJson('/api/members')
            ->assertOk()
            ->assertJsonPath('data.*.name', ['Yodi', 'Oya']);
    }

    public function test_payer_and_claimant_must_be_a_member(): void
    {
        $this->signIn();

        $this->postJson('/api/expenses', [
            'title' => 'Groceries', 'category' => 'groceries', 'amount' => 1000,
            'spent_at' => now()->toDateString(), 'payment_method' => 'cash', 'paid_by' => 'Tetangga',
        ])->assertUnprocessable()->assertJsonValidationErrors('paid_by');

        $this->postJson('/api/reimbursements', [
            'title' => 'Covered a bill', 'claimant' => 'Tetangga', 'amount' => 1000,
            'status' => 'pending', 'submitted_at' => now()->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('claimant');
    }

    public function test_member_seeder_creates_both_accounts_with_hashed_passwords(): void
    {
        config(['household.members' => [
            ['name' => 'Yodi', 'email' => 'yodifm@gmail.com', 'password' => 'pw-yodi'],
            ['name' => 'Oya', 'email' => 'nuron.soraya@gmail.com', 'password' => 'pw-oya'],
        ]]);

        $this->seed(HouseholdMemberSeeder::class);
        $this->seed(HouseholdMemberSeeder::class); // idempotent

        $this->assertSame(2, User::count());
        $this->assertTrue(Hash::check('pw-oya', User::where('email', 'nuron.soraya@gmail.com')->value('password')));
    }
}
