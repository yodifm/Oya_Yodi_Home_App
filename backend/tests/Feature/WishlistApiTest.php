<?php

namespace Tests\Feature;

use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistApiTest extends TestCase
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
            'name' => 'Refrigerator',
            'estimated_price' => 5000000,
            'saved_amount' => 1000000,
            'priority' => 'high',
            'status' => 'saving',
            'target_date' => null,
            'url' => null,
            'notes' => null,
            ...$overrides,
        ];
    }

    public function test_it_creates_an_item(): void
    {
        $this->postJson('/api/wishlist', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Refrigerator');
    }

    public function test_it_records_who_added_the_wish(): void
    {
        // signIn() in setUp is Yodi; a client can't claim someone else made it.
        $id = $this->postJson('/api/wishlist', [...$this->payload(), 'created_by_id' => 999, 'created_by' => 'Oya'])
            ->assertCreated()
            ->assertJsonPath('data.created_by', 'Yodi')
            ->assertJsonPath('data.created_at', now()->toDateString())
            ->json('data.id');

        // Stored by id, so a rename shows up without touching the wish.
        \App\Models\User::where('name', 'Yodi')->update(['name' => 'Yodi F']);
        $this->getJson('/api/wishlist')->assertJsonPath('data.0.created_by', 'Yodi F');

        // Editing doesn't change who added it.
        $this->putJson("/api/wishlist/{$id}", $this->payload(['name' => 'Fridge']))->assertJsonPath('data.created_by', 'Yodi F');
    }

    public function test_older_wishes_have_no_creator(): void
    {
        WishlistItem::factory()->create();

        $this->getJson('/api/wishlist')->assertJsonPath('data.0.created_by', null);
    }

    public function test_saved_amount_cannot_exceed_price(): void
    {
        $this->postJson('/api/wishlist', $this->payload(['saved_amount' => 6000000]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('saved_amount');
    }

    public function test_open_items_sort_by_priority_and_purchased_sink(): void
    {
        WishlistItem::factory()->create(['name' => 'Bought', 'priority' => 'high', 'status' => 'purchased']);
        WishlistItem::factory()->create(['name' => 'Low', 'priority' => 'low']);
        WishlistItem::factory()->create(['name' => 'High', 'priority' => 'high']);

        $names = collect($this->getJson('/api/wishlist')->json('data'))->pluck('name')->all();

        $this->assertSame(['High', 'Low', 'Bought'], $names);
    }

    public function test_it_updates_and_deletes(): void
    {
        $item = WishlistItem::factory()->create();

        $this->putJson("/api/wishlist/{$item->id}", $this->payload(['status' => 'purchased', 'saved_amount' => 5000000]))
            ->assertOk()
            ->assertJsonPath('data.status', 'purchased');

        $this->deleteJson("/api/wishlist/{$item->id}")->assertNoContent();
        $this->assertModelMissing($item);
    }
}
