<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent by `php artisan notifications:test` to prove the mail settings work. */
class TestEmail extends Notification
{
    use Queueable;

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Yodi & Oya — email is working')
            ->greeting('It works.')
            ->line('This is a test from your household book. If you can read this, notification emails are set up correctly.')
            ->line('From now on you will hear about new expenses, new reimbursement claims, claim status changes and budgets that go over their limit.')
            ->action('Open Yodi & Oya', Labels::appUrl('/'));
    }
}
