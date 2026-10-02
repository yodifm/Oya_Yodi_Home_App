<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\BudgetExceeded;
use App\Notifications\ExpenseRecorded;
use App\Notifications\ReimbursementStatusChanged;
use App\Notifications\ReimbursementSubmitted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $oya;

    private User $yodi;

    protected function setUp(): void
    {
        parent::setUp();
        $this->oya = $this->signIn('Oya');
        $this->yodi = User::where('name', 'Yodi')->firstOrFail();
        Notification::fake();
    }

    private function expense(array $overrides = []): array
    {
        return [
            'title' => 'Groceries run', 'category' => 'groceries', 'amount' => 100000,
            'spent_at' => now()->toDateString(), 'payment_method' => 'cash', 'bank' => null,
            'paid_by' => 'Oya', 'notes' => null, ...$overrides,
        ];
    }

    private function claim(array $overrides = []): array
    {
        return [
            'title' => 'Covered the bill', 'claimant' => 'Oya', 'amount' => 250000,
            'status' => 'pending', 'submitted_at' => now()->toDateString(), 'notes' => null, ...$overrides,
        ];
    }

    public function test_a_new_expense_emails_the_partner_not_the_person_who_recorded_it(): void
    {
        $this->postJson('/api/expenses', $this->expense())->assertCreated();

        Notification::assertSentTo($this->yodi, ExpenseRecorded::class, fn ($n) => $n->actor === 'Oya');
        Notification::assertNotSentTo($this->oya, ExpenseRecorded::class);
    }

    public function test_the_email_reads_like_the_app(): void
    {
        $this->postJson('/api/expenses', $this->expense(['amount' => 609500, 'payment_method' => 'transfer', 'bank' => 'bca']));

        Notification::assertSentTo($this->yodi, ExpenseRecorded::class, function (ExpenseRecorded $n) {
            $mail = $n->toMail($this->yodi);
            $body = implode("\n", $mail->introLines);

            return $mail->subject === 'Oya recorded an expense: Groceries run · Rp 609.500'
                && str_contains($body, 'Transfer · BCA')
                && str_ends_with($mail->actionUrl, '/expenses');
        });
    }

    public function test_members_who_switched_emails_off_get_nothing(): void
    {
        $this->yodi->update(['email_notifications' => false]);

        $this->postJson('/api/expenses', $this->expense());

        Notification::assertNothingSent();
    }

    public function test_editing_an_expense_does_not_email_again(): void
    {
        $id = $this->postJson('/api/expenses', $this->expense())->json('data.id');
        Notification::fake(); // forget the "recorded" email

        $this->putJson("/api/expenses/{$id}", $this->expense(['title' => 'Groceries (fixed)']))->assertOk();

        Notification::assertNothingSent();
    }

    public function test_buying_a_wish_emails_the_resulting_expense(): void
    {
        $wish = WishlistItem::factory()->create();

        $this->postJson("/api/wishlist/{$wish->id}/purchase", [
            'amount' => 900000, 'category' => 'household', 'spent_at' => now()->toDateString(),
            'payment_method' => 'cash', 'bank' => null, 'paid_by' => 'Oya',
        ])->assertOk();

        Notification::assertSentTo($this->yodi, ExpenseRecorded::class);
    }

    public function test_claims_email_on_submission_and_on_status_change_only(): void
    {
        $id = $this->postJson('/api/reimbursements', $this->claim())->json('data.id');
        Notification::assertSentTo($this->yodi, ReimbursementSubmitted::class);

        // Yodi approves → Oya hears about it.
        $this->signInAs($this->yodi);
        $this->putJson("/api/reimbursements/{$id}", $this->claim(['status' => 'approved']))->assertOk();
        Notification::assertSentTo(
            $this->oya,
            ReimbursementStatusChanged::class,
            fn ($n) => $n->actor === 'Yodi' && $n->from->value === 'pending' && $n->claim->status->value === 'approved',
        );

        // Changing only the notes is not a status change.
        Notification::fake();
        $this->putJson("/api/reimbursements/{$id}", $this->claim(['status' => 'approved', 'notes' => 'receipt in drawer']));
        Notification::assertNothingSent();
    }

    public function test_budget_email_goes_out_once_when_the_limit_is_crossed(): void
    {
        Budget::create(['category' => 'groceries', 'amount' => 250000]);

        $this->postJson('/api/expenses', $this->expense(['amount' => 200000])); // 200k ≤ 250k
        Notification::assertNotSentTo([$this->oya, $this->yodi], BudgetExceeded::class);

        $this->postJson('/api/expenses', $this->expense(['amount' => 100000])); // 300k > 250k: crossed
        Notification::assertSentTo([$this->oya, $this->yodi], BudgetExceeded::class, fn ($n) => $n->spent === 300000 && $n->limit === 250000);

        Notification::fake();
        $this->postJson('/api/expenses', $this->expense(['amount' => 50000])); // already over: no repeat
        Notification::assertNotSentTo([$this->oya, $this->yodi], BudgetExceeded::class);
    }

    public function test_an_edit_that_pushes_a_category_over_also_alerts(): void
    {
        Budget::create(['category' => 'groceries', 'amount' => 250000]);
        $id = $this->postJson('/api/expenses', $this->expense(['amount' => 200000]))->json('data.id');
        Notification::fake();

        $this->putJson("/api/expenses/{$id}", $this->expense(['amount' => 260000]))->assertOk();

        Notification::assertSentTo($this->yodi, BudgetExceeded::class, fn ($n) => $n->spent === 260000);
    }

    public function test_mail_failures_never_break_saving(): void
    {
        Notification::swap(new class
        {
            public function send(): void
            {
                throw new \RuntimeException('SMTP down');
            }

            public function __call($name, $args) {}
        });

        $this->postJson('/api/expenses', $this->expense())->assertCreated();
        $this->assertSame(1, Expense::count());
    }

    public function test_the_switch_is_part_of_the_users_api(): void
    {
        $this->getJson('/api/users')->assertJsonPath('data.0.email_notifications', true);

        $this->putJson("/api/users/{$this->yodi->id}", [
            'name' => 'Yodi', 'email' => $this->yodi->email, 'email_notifications' => false,
        ])->assertOk()->assertJsonPath('data.email_notifications', false);

        $this->postJson('/api/users', [
            'name' => 'Mama', 'email' => 'mama@example.com', 'password' => 'secret-123', 'password_confirmation' => 'secret-123',
        ])->assertCreated()->assertJsonPath('data.email_notifications', true);
    }

    private function signInAs(User $user): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($user);
    }
}
