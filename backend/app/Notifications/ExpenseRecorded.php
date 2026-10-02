<?php

namespace App\Notifications;

use App\Models\Expense;
use App\Support\Rupiah;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** "Oya recorded an expense: Electricity bill · Rp 609.500" */
class ExpenseRecorded extends Notification
{
    use Queueable;

    public function __construct(public Expense $expense, public string $actor) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $e = $this->expense;

        return (new MailMessage)
            ->subject("{$this->actor} recorded an expense: {$e->title} · ".Rupiah::format($e->amount))
            ->greeting("Hi {$notifiable->name},")
            ->line("**{$this->actor}** just recorded a new expense in the household book.")
            ->line(Labels::details(array_filter([
                'Expense' => $e->title,
                'Amount' => Rupiah::format($e->amount),
                'Category' => Labels::category($e->category),
                'Date' => $e->spent_at->format('j M Y'),
                'Paid by' => $e->paid_by.' · '.Labels::payment($e->payment_method, $e->bank),
                'Notes' => $e->notes,
            ])))
            ->action('Open the expense book', Labels::appUrl('/expenses'));
    }
}
