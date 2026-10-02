<?php

/*
 * Merged over Laravel's built-in English messages: only the friendly field
 * names live here, so errors read "The amount field…" not "The amount field"
 * with raw keys like "spent at" or "paid by".
 */
return [
    'attributes' => [
        'title' => 'description',
        'spent_at' => 'date',
        'payment_method' => 'payment method',
        'paid_by' => 'paid by',
        'claimant' => 'claimed by',
        'submitted_at' => 'submission date',
        'name' => 'item name',
        'estimated_price' => 'estimated price',
        'saved_amount' => 'saved amount',
        'target_date' => 'target date',
        'url' => 'product link',
        'bank' => 'bank',
    ],

    'values' => [
        'spent_at' => ['today' => 'today'],
        'payment_method' => ['transfer' => 'bank transfer'],
        'submitted_at' => ['today' => 'today'],
    ],
];
