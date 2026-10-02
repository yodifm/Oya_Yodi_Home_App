<?php

/*
 * The frontend is served from its own domain (FRONTEND_URL, comma-separated
 * for several) and calls this API with a bearer token, so no cookies and no
 * credentials. In local development Vite proxies /api, so CORS is not used.
 */
return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        fn (string $url) => rtrim(trim($url), '/'),
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5180')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // CSV export: the browser only lets the app read the file name if exposed.
    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 86400,

    'supports_credentials' => false,

];
