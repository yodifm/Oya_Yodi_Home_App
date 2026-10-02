<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\TestEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Throwable;

class SendTestNotification extends Command
{
    protected $signature = 'notifications:test {email? : Address to send to (defaults to every member with emails on)}';

    protected $description = 'Send a test email to check the mail settings in .env';

    public function handle(): int
    {
        $mailer = config('mail.default');
        if (in_array($mailer, ['log', 'array'], true)) {
            $this->warn("MAIL_MAILER is \"{$mailer}\": nothing will actually be sent. Set MAIL_MAILER=smtp in backend/.env.");

            return self::FAILURE;
        }

        $to = $this->argument('email')
            ? [$this->argument('email')]
            : User::where('email_notifications', true)->pluck('email')->all();

        if (! $to) {
            $this->warn('No recipients: give an address, or switch emails on for someone on the Users page.');

            return self::FAILURE;
        }

        foreach ($to as $address) {
            try {
                Notification::route('mail', $address)->notifyNow(new TestEmail);
                $this->info("Sent to {$address}");
            } catch (Throwable $e) {
                // Common causes: wrong app password, MAIL_USERNAME not the same Gmail account.
                $this->error("Could not send to {$address}: ".$e->getMessage());

                return self::FAILURE;
            }
        }

        return self::SUCCESS;
    }
}
