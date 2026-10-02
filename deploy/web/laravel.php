<?php

// Hands /api/* requests (routed here by .htaccess) to the Laravel app in
// app/backend, which sits outside the public web/ folder.
require __DIR__.'/../app/backend/public/index.php';
