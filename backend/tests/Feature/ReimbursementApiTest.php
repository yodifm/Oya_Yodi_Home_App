<?php

namespace Tests\Feature;

use App\Models\Reimbursement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReimbursementApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signIn();
    }

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Covered the electricity bill',
            'claimant' => 'Yodi',
            'amount' => 450000,
            'status' => 'pending',
            'submitted_at' => now()->toDateString(),
            'notes' => null,
            ...$overrides,
        ];
    }

    public function test_settled_at_follows_status(): void
    {
        $id = $this->postJson('/api/reimbursements', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.settled_at', null)
            ->json('data.id');

        $this->putJson("/api/reimbursements/{$id}", $this->payload(['status' => 'paid']))
            ->assertJsonPath('data.settled_at', now()->toDateString());

        // Reopening a claim clears its settlement date.
        $this->putJson("/api/reimbursements/{$id}", $this->payload(['status' => 'approved']))
            ->assertJsonPath('data.settled_at', null);
    }

    public function test_client_cannot_set_settled_at_directly(): void
    {
        $this->postJson('/api/reimbursements', $this->payload(['settled_at' => '2020-01-01']))
            ->assertJsonPath('data.settled_at', null);
    }

    public function test_it_filters_by_status(): void
    {
        Reimbursement::factory(2)->create();
        Reimbursement::factory()->create(['status' => 'paid']);

        $this->getJson('/api/reimbursements?status=pending')->assertJsonCount(2, 'data');
    }
}
