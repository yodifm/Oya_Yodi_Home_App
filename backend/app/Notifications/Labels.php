<?php

namespace App\Notifications;

use App\Enums\Bank;
use App\Enums\ExpenseCategory;
use App\Enums\PaymentMethod;
use App\Enums\ReimbursementStatus;
use Illuminate\Support\HtmlString;

/**
 * Display names for emails — the same wording the frontend uses
 * (frontend/src/lib/labels.ts), so an email reads like the app.
 */
final class Labels
{
    public static function category(ExpenseCategory $c): string
    {
        return match ($c) {
            ExpenseCategory::Groceries => 'Groceries',
            ExpenseCategory::Food => 'Food',
            ExpenseCategory::Utilities => 'Utilities',
            ExpenseCategory::Transport => 'Transport',
            ExpenseCategory::Household => 'Household Supplies',
            ExpenseCategory::Health => 'Health',
            ExpenseCategory::Education => 'Education',
            ExpenseCategory::Entertainment => 'Entertainment',
            ExpenseCategory::Other => 'Other',
        };
    }

    public static function payment(PaymentMethod $method, ?Bank $bank): string
    {
        return match ($method) {
            PaymentMethod::Cash => 'Cash',
            PaymentMethod::EWallet => 'E-Wallet',
            PaymentMethod::Transfer => $bank ? 'Transfer · '.self::bank($bank) : 'Bank Transfer',
        };
    }

    public static function bank(Bank $bank): string
    {
        return match ($bank) {
            Bank::Bca => 'BCA',
            Bank::LineBank => 'Line Bank',
            Bank::Mandiri => 'Mandiri',
        };
    }

    public static function status(ReimbursementStatus $s): string
    {
        return match ($s) {
            ReimbursementStatus::Pending => 'Pending',
            ReimbursementStatus::Approved => 'Approved',
            ReimbursementStatus::Paid => 'Paid',
            ReimbursementStatus::Rejected => 'Rejected',
        };
    }

    /**
     * A small label/value table for an email body. MailMessage::line() folds
     * line breaks into one sentence, so details go in a table instead.
     * Inline styles only: mail clients ignore most <style> rules.
     *
     * @param  array<string, string>  $rows  label => value (values are escaped)
     */
    public static function details(array $rows): HtmlString
    {
        $html = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-top:1px solid #e8e4df;">';
        foreach ($rows as $label => $value) {
            $html .= '<tr>'
                .'<td style="padding:8px 12px 8px 0;border-bottom:1px solid #e8e4df;color:#6b6b6b;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">'.e($label).'</td>'
                .'<td style="padding:8px 0;border-bottom:1px solid #e8e4df;color:#1a1a1a;font-size:15px;text-align:right;">'.e($value).'</td>'
                .'</tr>';
        }

        return new HtmlString($html.'</table>');
    }

    /** Link into the React app (FRONTEND_URL in .env). */
    public static function appUrl(string $path = '/'): string
    {
        return rtrim((string) config('app.frontend_url'), '/').$path;
    }
}
