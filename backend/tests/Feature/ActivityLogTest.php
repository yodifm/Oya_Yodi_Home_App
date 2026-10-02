<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Expense;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private User $me;

    protected function setUp(): void
    {
        parent::setUp();
        $this->me = $this->signIn('Oya');
        ActivityLog::query()->delete(); // ignore the users created by signIn()
    }

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Electricity bill', 'category' => 'utilities', 'amount' => 600000,
            'spent_at' => now()->toDateString(), 'payment_method' => 'cash', 'payment_account' => null,
            'paid_by' => 'Oya', 'notes' => null, ...$overrides,
        ];
    }

    public function test_create_update_delete_are_recorded_with_who_and_what(): void
    {
        $id = $this->postJson('/api/expenses', $this->payload())->json('data.id');
        $this->putJson("/api/expenses/{$id}", $this->payload(['amount' => 609500, 'title' => 'Electricity bill']))->assertOk();
        $this->deleteJson("/api/expenses/{$id}")->assertNoContent();

        $logs = $this->getJson('/api/activity')->assertOk()->json('data');

        $this->assertSame(['deleted', 'updated', 'created'], array_column($logs, 'action'));
        $this->assertSame('Oya', $logs[0]['user']);
        $this->assertSame('expense', $logs[0]['subject_type']);
        // The label survives the deletion.
        $this->assertSame('Electricity bill · Rp 609.500', $logs[0]['summary']);
        // Updates keep only what changed, as [old, new].
        $this->assertSame(['amount' => [600000, 609500]], $logs[1]['changes']);
    }

    public function test_saving_without_changes_records_nothing(): void
    {
        $id = $this->postJson('/api/expenses', $this->payload())->json('data.id');
        $this->putJson("/api/expenses/{$id}", $this->payload())->assertOk();

        $this->assertSame(1, ActivityLog::count());
    }

    public function test_enums_dates_and_receipts_are_stored_readably(): void
    {
        Storage::fake('local');
        $id = $this->postJson('/api/expenses', $this->payload())->json('data.id');

        $this->putJson("/api/expenses/{$id}", $this->payload(['payment_method' => 'transfer', 'payment_account' => 'bca', 'spent_at' => now()->subDay()->toDateString()]));
        $this->post("/api/expenses/{$id}/receipt", ['receipt' => UploadedFile::fake()->image('nota.jpg')], ['Accept' => 'application/json']);

        [$receipt, $edit] = $this->getJson('/api/activity')->json('data');
        $this->assertSame(['cash', 'transfer'], $edit['changes']['payment_method']);
        $this->assertSame([null, 'bca'], $edit['changes']['payment_account']);
        $this->assertSame([now()->toDateString(), now()->subDay()->toDateString()], $edit['changes']['spent_at']);
        $this->assertSame(['receipt' => [false, true]], $receipt['changes']);
    }

    public function test_passwords_are_never_recorded(): void
    {
        $this->putJson("/api/users/{$this->me->id}", [
            'name' => 'Oya', 'email' => $this->me->email,
            'password' => 'brand-new-secret', 'password_confirmation' => 'brand-new-secret',
        ])->assertOk();

        $log = ActivityLog::sole();
        $this->assertSame(['password' => null], $log->changes);
        $this->assertStringNotContainsString('brand-new-secret', json_encode($log->toArray()));
    }

    public function test_derived_fields_stay_out_of_the_history(): void
    {
        $id = $this->postJson('/api/reimbursements', [
            'title' => 'Covered a bill', 'claimant' => 'Oya', 'amount' => 1000,
            'status' => 'pending', 'submitted_at' => now()->toDateString(), 'notes' => null,
        ])->json('data.id');

        $this->putJson("/api/reimbursements/{$id}", [
            'title' => 'Covered a bill', 'claimant' => 'Oya', 'amount' => 1000,
            'status' => 'paid', 'submitted_at' => now()->toDateString(), 'notes' => null,
        ]);

        $update = ActivityLog::where('action', 'updated')->sole();
        $this->assertSame(['status' => ['pending', 'paid']], $update->changes); // no settled_at
    }

    public function test_filters_by_person_and_type(): void
    {
        $this->postJson('/api/expenses', $this->payload());
        $this->putJson('/api/budgets/groceries', ['amount' => 1000000]);

        $this->getJson('/api/activity?subject_type=budget')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.summary', 'groceries');

        $yodi = User::where('name', 'Yodi')->first();
        $this->getJson("/api/activity?user_id={$yodi->id}")->assertJsonCount(0, 'data');
        $this->getJson("/api/activity?user_id={$this->me->id}")->assertJsonCount(2, 'data');
        $this->getJson('/api/activity?subject_type=passwords')->assertUnprocessable();
    }

    public function test_history_requires_sign_in(): void
    {
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', '')->getJson('/api/activity')->assertUnauthorized();
    }

    public function test_seeding_sample_data_leaves_the_history_empty(): void
    {
        ActivityLog::query()->delete();
        config(['household.members' => [
            ['name' => 'Yodi', 'email' => 'y@example.com', 'password' => 'password123'],
            ['name' => 'Oya', 'email' => 'o@example.com', 'password' => 'password123'],
        ]]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, ActivityLog::count());
        $this->assertTrue(ActivityLog::$enabled, 'logging is switched back on afterwards');
        Expense::factory()->create();
        $this->assertSame(1, ActivityLog::count());
    }
}
