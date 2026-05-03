<?php
/**
 * Database Configuration and Connection
 * Handled via PDO for security and performance.
 */

// Include centralized config
require_once 'config.php';

// --- Database Credentials ---
$host     = DB_HOST;
$db_name  = DB_NAME;
$username = DB_USER;
$password = DB_PASS;

// --- CORS & Headers ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// --- Handle Preflight (OPTIONS) Request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Initialize PDO Connection with charset and port
    $dsn = "mysql:host=$host;port=3306;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $username, $password, $options);

    // If this file is called directly, return success JSON
    if (basename($_SERVER['PHP_SELF']) === 'db.php' && isset($_GET['test'])) {
        echo json_encode([
            "status" => "success",
            "message" => "Database connection established successfully."
        ]);
        exit();
    }

} catch (PDOException $e) {
    // Return JSON error response on failure
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit();
}
?>
