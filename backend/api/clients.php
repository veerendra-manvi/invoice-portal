<?php
/**
 * Clients API
 * Handles CRUD operations for clients
 * NOTE: Using user_id instead of session due to hosting limitation
 */

// REMOVE: Authorization header checks, Bearer token logic, session_start() auth checks
require_once '../config/db.php';

// 3. Add simple user_id validation at top:
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "User ID required"
    ]);
    exit();
}

$userId = $user_id; // For compatibility with handle functions

$method = $_SERVER['REQUEST_METHOD'];
$clientId = isset($_GET['id']) ? intval($_GET['id']) : null;

// Get raw input for POST and PUT
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if ($clientId) {
            handleGetSingleClient($pdo, $userId, $clientId);
        } else {
            handleGetAllClients($pdo, $userId);
        }
        break;
    case 'POST':
        handleCreateClient($pdo, $userId, $input);
        break;
    case 'PUT':
        if ($clientId) {
            handleUpdateClient($pdo, $userId, $clientId, $input);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Client ID is required for update."]);
        }
        break;
    case 'DELETE':
        if ($clientId) {
            handleDeleteClient($pdo, $userId, $clientId);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Client ID is required for deletion."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        break;
}

/**
 * Fetch all clients for the logged-in user
 */
function handleGetAllClients($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $clients = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => $clients
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to fetch clients: " . $e->getMessage()]);
    }
}

/**
 * Fetch a single client by ID
 */
function handleGetSingleClient($pdo, $userId, $clientId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ? AND user_id = ?");
        $stmt->execute([$clientId, $userId]);
        $client = $stmt->fetch();

        if ($client) {
            echo json_encode([
                "status" => "success",
                "data" => $client
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Client not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}

/**
 * Create a new client
 */
function handleCreateClient($pdo, $userId, $input) {
    $name = isset($input['name']) ? trim($input['name']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $phone = isset($input['phone']) ? trim($input['phone']) : '';
    $address = isset($input['address']) ? trim($input['address']) : '';

    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Name and email are required."]);
        return;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO clients (user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $email, $phone, $address]);

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Client created successfully.",
            "client_id" => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create client: " . $e->getMessage()]);
    }
}

/**
 * Update an existing client
 */
function handleUpdateClient($pdo, $userId, $clientId, $input) {
    $name = isset($input['name']) ? trim($input['name']) : null;
    $email = isset($input['email']) ? trim($input['email']) : null;
    $phone = isset($input['phone']) ? trim($input['phone']) : null;
    $address = isset($input['address']) ? trim($input['address']) : null;

    if (!$name || !$email) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Name and email are required for update."]);
        return;
    }

    try {
        // Verify ownership first
        $stmt = $pdo->prepare("SELECT id FROM clients WHERE id = ? AND user_id = ?");
        $stmt->execute([$clientId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Client not found or access denied."]);
            return;
        }

        $stmt = $pdo->prepare("UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$name, $email, $phone, $address, $clientId, $userId]);

        echo json_encode([
            "status" => "success",
            "message" => "Client updated successfully."
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
    }
}

/**
 * Delete a client
 */
function handleDeleteClient($pdo, $userId, $clientId) {
    try {
        $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ? AND user_id = ?");
        $stmt->execute([$clientId, $userId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                "status" => "success",
                "message" => "Client deleted successfully."
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Client not found or access denied."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Delete failed: " . $e->getMessage()]);
    }
}
