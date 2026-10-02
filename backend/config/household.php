<?php

/*
 * The people who share this household ledger. Each one gets a login account
 * (created by the seeder) and appears in the "Paid by" / "Claimed by"
 * dropdowns. Passwords live in .env only and are hashed when seeded.
 */
return [
    'members' => [
        ['name' => 'Yodi', 'email' => 'yodifm@gmail.com', 'password' => env('YODI_PASSWORD')],
        ['name' => 'Oya', 'email' => 'nuron.soraya@gmail.com', 'password' => env('OYA_PASSWORD')],
    ],
];
