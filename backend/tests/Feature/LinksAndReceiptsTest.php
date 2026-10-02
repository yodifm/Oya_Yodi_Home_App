<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LinksAndReceiptsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signIn();
        Storage::fake('local');
    }

    public function test_purchasing_a_wishlist_item_records_an_expense(): void
    {
        $item = WishlistItem::factory()->create(['name' => 'Sofa', 'estimated_price' => 5000000]);
        $purchase = [
            'amount' => 4800000, 'category' => 'household', 'spent_at' => now()->toDateString(),
            'payment_method' => 'e-wallet', 'paid_by' => 'Oya',
        ];

        $res = $this->postJson("/api/wishlist/{$item->id}/purchase", $purchase)
            ->assertOk()
            ->assertJsonPath('data.status', 'purchased');

        $expense = Expense::findOrFail($res->json('data.expense_id'));
        $this->assertSame('Sofa', $expense->title);
        $this->assertSame(4800000, $expense->amount);

        // Buying twice is refused.
        $this->postJson("/api/wishlist/{$item->id}/purchase", $purchase)->assertUnprocessable();

        // Reopening the wish unlinks it (the expense stays) so it can be bought again.
        $this->putJson("/api/wishlist/{$item->id}", [
            'name' => 'Sofa', 'estimated_price' => 5000000, 'saved_amount' => 0,
            'priority' => 'medium', 'status' => 'wanted', 'target_date' => null, 'url' => null, 'notes' => null,
        ])->assertOk()->assertJsonPath('data.expense_id', null);
        $this->assertModelExists($expense);
        $this->postJson("/api/wishlist/{$item->id}/purchase", $purchase)->assertOk();
    }

    public function test_reimbursement_list_is_paginated_with_status_summary(): void
    {
        Reimbursement::factory(22)->create(['amount' => 1000]);
        Reimbursement::factory()->create(['status' => 'paid', 'amount' => 7000]);

        $this->getJson('/api/reimbursements')
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 23)
            ->assertJsonPath('summary.pending', ['count' => 22, 'total' => 22000])
            ->assertJsonPath('summary.paid', ['count' => 1, 'total' => 7000]);

        // The summary stays global when a tab filters the list.
        $this->getJson('/api/reimbursements?status=paid')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.pending.count', 22);
    }

    public function test_receipts_upload_view_replace_and_delete(): void
    {
        $expense = Expense::factory()->create();
        $url = "/api/expenses/{$expense->id}/receipt";

        $this->getJson($url)->assertNotFound();

        $this->post($url, ['receipt' => UploadedFile::fake()->image('nota.jpg')], ['Accept' => 'application/json'])->assertOk();
        $first = $expense->fresh()->receipt_path;
        Storage::disk('local')->assertExists($first);
        $this->getJson("/api/expenses/{$expense->id}")->assertJsonPath('data.has_receipt', true);
        $this->get($url)->assertOk();

        // Replacing removes the old file.
        $this->post($url, ['receipt' => UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('local')->assertMissing($first);

        $this->deleteJson($url)->assertNoContent();
        $this->assertNull($expense->fresh()->receipt_path);
    }

    public function test_receipt_rules_and_cleanup_on_delete(): void
    {
        $claim = Reimbursement::factory()->create();
        $url = "/api/reimbursements/{$claim->id}/receipt";

        $this->post($url, ['receipt' => UploadedFile::fake()->create('virus.exe', 10)], ['Accept' => 'application/json'])
            ->assertUnprocessable();
        $this->post($url, ['receipt' => UploadedFile::fake()->image('huge.jpg')->size(9000)], ['Accept' => 'application/json'])
            ->assertUnprocessable();

        $this->post($url, ['receipt' => UploadedFile::fake()->image('ok.png')], ['Accept' => 'application/json'])->assertOk();
        $path = $claim->fresh()->receipt_path;

        $this->deleteJson("/api/reimbursements/{$claim->id}")->assertNoContent();
        Storage::disk('local')->assertMissing($path);

        $this->getJson('/api/wishlist/1/receipt')->assertNotFound();
    }
}
