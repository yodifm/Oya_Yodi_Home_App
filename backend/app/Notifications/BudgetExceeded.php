<?php

namespace App\Notifications;

use App\Enums\ExpenseCategory;
use App\Support\Rupiah;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

/** A category went past its monthly limit — sent once, when it crosses. */
class BudgetExceeded extends Notification
{
    use Queueable;

    public function __construct(
        public ExpenseCategory $category,
        public int $limit,
        public int $spent,
        public string $month,
        public string $actor,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = Labels::category($this->category);
        $monthName = Carbon::createFromFormat('!Y-m', $this->month)->format('F Y');
        $over = $this->spent - $this->limit;

        return (new MailMessage)
            ->subject("Over budget: {$name} in {$monthName}")
            ->greeting("Hi {$notifiable->name},")
            ->line("**{$name}** has gone past its monthly budget for {$monthName}, after an expense recorded by {$this->actor}.")
            ->line(Labels::details([
                'Budget' => Rupiah::format($this->limit),
                'Spent' => Rupiah::format($this->spent),
                'Over by' => Rupiah::format($over),
            ]))
            ->action('See budgets', Labels::appUrl('/budgets'));
    }
}
