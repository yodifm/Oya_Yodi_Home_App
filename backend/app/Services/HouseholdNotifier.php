<?php

namespace App\Services;

use App\Enums\ReimbursementStatus;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\Reimbursement;
use App\Models\User;
use App\Notifications\BudgetExceeded;
use App\Notifications\ExpenseRecorded;
use App\Notifications\ReimbursementStatusChanged;
use App\Notifications\ReimbursementSubmitted;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as Notifier;
use Throwable;

/**
 * Decides who hears about what, by email.
 *
 * - New expense / new claim / claim status change → the *other* members
 *   (the person who did it already knows), if they have emails switched on.
 * - A category crossing its monthly budget → every member with emails on.
 *
 * Sending never breaks saving: a mail failure is logged and swallowed.
 */
class HouseholdNotifier
{
    public function expenseRecorded(Expense $expense, User $actor): void
    {
        $this->send($this->partnersOf($actor), new ExpenseRecorded($expense, $actor->name));
        $this->checkBudget($expense, $actor, 0);
    }

    /**
     * After an edit, only the budget can newly be crossed.
     *
     * @param  int  $previousShare  what this expense counted towards the same
     *                              category+month before the edit (0 if it was elsewhere)
     */
    public function expenseUpdated(Expense $expense, User $actor, int $previousShare): void
    {
        $this->checkBudget($expense, $actor, $previousShare);
    }

    public function claimSubmitted(Reimbursement $claim, User $actor): void
    {
        $this->send($this->partnersOf($actor), new ReimbursementSubmitted($claim, $actor->name));
    }

    public function claimStatusChanged(Reimbursement $claim, User $actor, ReimbursementStatus $from): void
    {
        $this->send($this->partnersOf($actor), new ReimbursementStatusChanged($claim, $actor->name, $from));
    }

    /** Email only on the expense that tips the category over — not on every one after. */
    private function checkBudget(Expense $expense, User $actor, int $previousShare): void
    {
        $limit = Budget::where('category', $expense->category)->value('amount');
        if ($limit === null) {
            return;
        }

        $month = $expense->spent_at->format('Y-m');
        $after = (int) Expense::inMonth($month)->where('category', $expense->category)->sum('amount');
        $before = $after - $expense->amount + $previousShare;

        if ($before <= $limit && $after > $limit) {
            $this->send(
                $this->membersWithEmails(),
                new BudgetExceeded($expense->category, (int) $limit, $after, $month, $actor->name),
            );
        }
    }

    /** @return Collection<int, User> */
    private function partnersOf(User $actor): Collection
    {
        return User::where('email_notifications', true)->whereKeyNot($actor->getKey())->get();
    }

    /** @return Collection<int, User> */
    private function membersWithEmails(): Collection
    {
        return User::where('email_notifications', true)->get();
    }

    private function send(Collection $users, Notification $notification): void
    {
        if ($users->isEmpty()) {
            return;
        }

        try {
            Notifier::send($users, $notification);
        } catch (Throwable $e) {
            Log::warning('Household email not sent: '.$e->getMessage(), ['notification' => $notification::class]);
        }
    }
}
