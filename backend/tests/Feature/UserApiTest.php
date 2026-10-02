<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    private User $me;

    protected function setUp(): void
    {
        parent::setUp();
        $this->me = $this->signIn('Yodi');
    }

    public function test_it_lists_users_with_usage_counts(): void
    {
        Expense::factory(2)->create(['paid_by' => 'Oya']);

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonPath('data.1.name', 'Oya')
            ->assertJsonPath('data.1.expenses_count', 2);
    }

    public function test_it_creates_a_user_who_can_sign_in_and_becomes_a_member(): void
    {
        $this->postJson('/api/users', [
            'name' => 'Mama', 'email' => 'mama@example.com',
            'password' => 'rahasia-123', 'password_confirmation' => 'rahasia-123',
        ])->assertCreated()->assertJsonPath('data.name', 'Mama');

        $this->assertTrue(Hash::check('rahasia-123', User::where('email', 'mama@example.com')->value('password')));
        $this->getJson('/api/members')->assertJsonPath('data.*.name', ['Yodi', 'Oya', 'Mama']);
    }

    public function test_create_validates_unique_name_email_and_password_rules(): void
    {
        $this->postJson('/api/users', [
            'name' => 'Oya', 'email' => $this->me->email,
            'password' => 'short', 'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_renaming_a_user_carries_through_to_their_records(): void
    {
        $oya = User::where('name', 'Oya')->first();
        Expense::factory()->create(['paid_by' => 'Oya']);
        Reimbursement::factory()->create(['claimant' => 'Oya']);

        $this->putJson("/api/users/{$oya->id}", ['name' => 'Soraya', 'email' => $oya->email])
            ->assertOk()
            ->assertJsonPath('data.name', 'Soraya');

        $this->assertSame(1, Expense::where('paid_by', 'Soraya')->count());
        $this->assertSame(1, Reimbursement::where('claimant', 'Soraya')->count());
    }

    public function test_blank_password_on_update_keeps_the_old_one(): void
    {
        $oya = User::where('name', 'Oya')->first();
        $oldHash = $oya->password;

        $this->putJson("/api/users/{$oya->id}", ['name' => 'Oya', 'email' => $oya->email, 'password' => null])->assertOk();

        $this->assertSame($oldHash, $oya->fresh()->password);
    }

    public function test_changing_a_password_signs_that_user_out_elsewhere(): void
    {
        $oya = User::where('name', 'Oya')->first();
        $oya->createToken('phone');

        $this->putJson("/api/users/{$oya->id}", [
            'name' => 'Oya', 'email' => $oya->email,
            'password' => 'baru-12345', 'password_confirmation' => 'baru-12345',
        ])->assertOk();

        $this->assertSame(0, $oya->tokens()->count());
    }

    public function test_cannot_delete_yourself(): void
    {
        $this->deleteJson("/api/users/{$this->me->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user');
    }

    public function test_cannot_delete_a_user_who_still_has_records(): void
    {
        $oya = User::where('name', 'Oya')->first();
        Expense::factory()->create(['paid_by' => 'Oya']);

        $this->deleteJson("/api/users/{$oya->id}")->assertUnprocessable();
        $this->assertModelExists($oya);
    }

    public function test_deletes_an_unused_user(): void
    {
        $oya = User::where('name', 'Oya')->first();

        $this->deleteJson("/api/users/{$oya->id}")->assertNoContent();
        $this->assertModelMissing($oya);
    }

    public function test_dashboard_can_filter_by_category(): void
    {
        $month = now()->format('Y-m');
        Expense::factory()->create(['spent_at' => now()->toDateString(), 'amount' => 100000, 'category' => 'groceries']);
        Expense::factory()->create(['spent_at' => now()->toDateString(), 'amount' => 300000, 'category' => 'utilities']);

        $this->getJson("/api/dashboard?month={$month}&category=groceries")
            ->assertOk()
            ->assertJsonPath('category', 'groceries')
            ->assertJsonPath('spending.this_month', 100000)
            ->assertJsonPath('spending.transactions', 1)
            ->assertJsonPath('trend.5.total', 100000)
            ->assertJsonCount(1, 'recent_expenses')
            // The breakdown still lists every category so it can be used to switch.
            ->assertJsonCount(2, 'by_category');

        $this->getJson('/api/dashboard?category=yachts')->assertUnprocessable();
    }
}
