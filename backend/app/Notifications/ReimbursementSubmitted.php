<?php

namespace App\Notifications;

use App\Models\Reimbursement;
use App\Support\Rupiah;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** A new claim to be paid back — the partner usually has to approve it. */
class ReimbursementSubmitted extends Notification
{
    use Queueable;

    public function __construct(public Reimbursement $claim, public string $actor) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $c = $this->claim;

        return (new MailMessage)
            ->subject("New claim from {$c->claimant}: {$c->title} · ".Rupiah::format($c->amount))
            ->greeting("Hi {$notifiable->name},")
            ->line("**{$this->actor}** submitted a reimbursement claim.")
            ->line(Labels::details(array_filter([
                'Claim' => $c->title,
                'Amount' => Rupiah::format($c->amount),
                'Claimed by' => $c->claimant,
                'Submitted' => $c->submitted_at->format('j M Y'),
                'Status' => Labels::status($c->status),
                'Notes' => $c->notes,
            ])))
            ->action('Review the claim', Labels::appUrl('/reimbursements'));
    }
}
