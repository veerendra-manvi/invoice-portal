<?php
/**
 * Application Configuration
 * Switch between local and production environments.
 */

$isLocal = ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['REMOTE_ADDR'] === '127.0.0.1');

if ($isLocal) {
    // --- LOCAL DEVELOPMENT SETTINGS ---
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'invoice_portal');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('FRONTEND_URL', 'http://localhost:5175');
} else {
    // --- PRODUCTION SETTINGS (InfinityFree) ---
    define('DB_HOST', 'sql202.infinityfree.com');
    define('DB_NAME', 'if0_41795807_invoice_portal');
    define('DB_USER', 'if0_41795807');
    define('DB_PASS', 'lg4eSTb5Va');
    define('FRONTEND_URL', 'https://invoiceportal.rf.gd');
}
