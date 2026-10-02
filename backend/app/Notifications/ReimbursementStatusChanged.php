<?php

namespace App\Notifications;

use App\Enums\ReimbursementStatus;
use App\Models\Reimbursement;
use App\Support\Rupiah;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** "Yodi approved your claim" — Approved / Paid / Rejected / reopened. */
class ReimbursementStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        public Reimbursement $claim,
        public string $actor,
        public ReimbursementStatus $from,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $c = $this->claim;
        $verb = match ($c->status) {
            ReimbursementStatus::Approved => 'approved',
            ReimbursementStatus::Paid => 'marked as paid',
            ReimbursementStatus::Rejected => 'rejected',
            ReimbursementStatus::Pending => 'moved back to pending',
        };

        return (new MailMessage)
            ->subject("Claim {$verb}: {$c->title} · ".Rupiah::format($c->amount))
            ->greeting("Hi {$notifiable->name},")
            ->line("**{$this->actor}** {$verb} a reimbursement claim.")
            ->line(Labels::details([
                'Claim' => $c->title,
                'Amount' => Rupiah::format($c->amount),
                'Claimed by' => $c->claimant,
                'Status' => Labels::status($this->from).' → '.Labels::status($c->status),
            ]))
            ->action('Open reimbursements', Labels::appUrl('/reimbursements'));
    }
}
