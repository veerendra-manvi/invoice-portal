<?php
/**
 * Authentication API
 * Handles Registration, Login, and Logout
 * NOTE: Using user_id instead of session due to hosting limitation
 */

// Start session at the very beginning
session_start();

// Include database configuration
require_once '../config/db.php';

// Get the action from query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Get raw POST data
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'register':
        handleRegister($pdo, $input);
        break;
    case 'login':
        handleLogin($pdo, $input);
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action or action missing."
        ]);
        break;
}

/**
 * Handle User Registration
 */
function handleRegister($pdo, $input) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        return;
    }

    $username = isset($input['name']) ? trim($input['name']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $businessName = isset($input['business_name']) ? trim($input['business_name']) : null;

    // Validation
    if (empty($username) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Name, email, and password are required."]);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format."]);
        return;
    }

    try {
        // Check for duplicate email
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Email already exists."]);
            return;
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user with business details
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, business_name, currency, tax_rate) VALUES (?, ?, ?, ?, 'INR', 0)");
        $stmt->execute([$username, $email, $hashedPassword, $businessName]);
        
        $userId = $pdo->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "User registered successfully.",
            "user_id" => $userId
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Registration failed: " . $e->getMessage()]);
    }
}

/**
 * Handle User Login
 */
function handleLogin($pdo, $input) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        return;
    }

    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email and password are required."]);
        return;
    }

    try {
        // Fetch user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Store user_id in session
            $_SESSION['user_id'] = $user['id'];

            // Remove password from response
            unset($user['password']);

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Login successful.",
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['username'] ?? $user['name'] ?? '',
                    "email" => $user['email'],
                    "business_name" => $user['business_name']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Login failed: " . $e->getMessage()]);
    }
}

/**
 * Handle User Logout
 */
function handleLogout() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        return;
    }

    // Unset all session variables
    $_SESSION = array();

    // Destroy the session
    session_destroy();

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Logged out successfully."
    ]);
}
