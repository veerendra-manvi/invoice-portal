<?php
/**
 * Invoices API
 * Handles Invoices and Line Items
 * NOTE: Using user_id instead of session due to hosting limitation
 */

require_once '../config/db.php';

// Get common parameters
$action = $_GET['action'] ?? $_POST['action'] ?? null;
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
$id = $_GET['id'] ?? $_POST['id'] ?? null;

// Validate User ID
if (!$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Action-based routing
if ($action === "get" || $action === "list" || $action === "getAll") {
    if ($id) {
        handleGetSingleInvoice($pdo, $user_id, $id);
    } else {
        handleGetAllInvoices($pdo, $user_id);
    }
} elseif ($action === "update") {
    handleUpdateInvoice($pdo, $user_id, $id, $input);
} elseif ($action === "delete") {
    handleDeleteInvoice($pdo, $user_id, $id);
} elseif ($action === "update_status") {
    $status = $_POST['status'] ?? $input['status'] ?? null;
    handleUpdateInvoiceStatus($pdo, $user_id, $id, $status);
} elseif ($method === 'POST') {
    handleCreateInvoice($pdo, $user_id, $input);
} elseif ($method === 'GET') {
    if ($id) {
        handleGetSingleInvoice($pdo, $user_id, $id);
    } else {
        handleGetAllInvoices($pdo, $user_id);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method or Action Not Allowed"]);
}

/**
 * Fetch all invoices
 */
function handleGetAllInvoices($pdo, $userId) {
    try {
        $query = "SELECT i.*, c.name as client_name 
                  FROM invoices i 
                  JOIN clients c ON i.client_id = c.id 
                  WHERE c.user_id = ? 
                  ORDER BY i.created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $invoices = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $invoices]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Fetch single invoice
 */
function handleGetSingleInvoice($pdo, $userId, $invoiceId) {
    try {
        $query = "SELECT i.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone, c.address AS client_address
                  FROM invoices i
                  JOIN clients c ON i.client_id = c.id
                  WHERE i.id = ? AND c.user_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$invoiceId, $userId]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Invoice not found"]);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
        $stmt->execute([$invoiceId]);
        $items = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => [
                "invoice" => $invoice,
                "items" => $items
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Create invoice
 */
function handleCreateInvoice($pdo, $userId, $input) {
    $clientId = $input['client_id'] ?? null;
    $items = $input['items'] ?? [];
    if (!$clientId || empty($items)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Client ID and items are required"]);
        return;
    }
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT id FROM clients WHERE id = ? AND user_id = ?");
        $stmt->execute([$clientId, $userId]);
        if (!$stmt->fetch()) throw new Exception("Invalid client ID");

        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM invoices");
        $nextId = ($stmt->fetch()['max_id'] ?? 0) + 1;
        $invoiceNumber = "INV-" . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        $subtotal = 0;
        foreach ($items as $item) $subtotal += ($item['quantity'] * $item['unit_price']);
        $taxRate = floatval($input['tax_rate'] ?? 0);
        $total = $subtotal + ($subtotal * ($taxRate / 100));

        $stmt = $pdo->prepare("INSERT INTO invoices (client_id, invoice_number, issue_date, due_date, status, subtotal, tax_rate, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$clientId, $invoiceNumber, $input['issue_date'] ?? date('Y-m-d'), $input['due_date'] ?? date('Y-m-d', strtotime('+14 days')), $input['status'] ?? 'Draft', $subtotal, $taxRate, $total, $input['notes'] ?? null]);
        $newId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
        foreach ($items as $item) {
            $stmt->execute([$newId, $item['description'], $item['quantity'], $item['unit_price'], $item['quantity'] * $item['unit_price']]);
        }
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Invoice created", "invoice_id" => $newId]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Update invoice
 */
function handleUpdateInvoice($pdo, $userId, $invoiceId, $input) {
    if (!$invoiceId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invoice ID required"]);
        return;
    }
    try {
        $pdo->beginTransaction();
        
        $subtotal = 0;
        $items = $input['items'] ?? [];
        foreach ($items as $item) $subtotal += ($item['quantity'] * $item['unit_price']);
        $taxRate = floatval($input['tax_rate'] ?? 0);
        $total = $subtotal + ($subtotal * ($taxRate / 100));

        $stmt = $pdo->prepare("UPDATE invoices SET issue_date=?, due_date=?, status=?, subtotal=?, tax_rate=?, total=?, notes=? WHERE id=? AND client_id IN (SELECT id FROM clients WHERE user_id=?)");
        $stmt->execute([$input['issue_date'], $input['due_date'], $input['status'], $subtotal, $taxRate, $total, $input['notes'] ?? null, $invoiceId, $userId]);

        // Refresh items: Delete and Re-insert
        $stmt = $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
        $stmt->execute([$invoiceId]);

        $stmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
        foreach ($items as $item) {
            $stmt->execute([$invoiceId, $item['description'], $item['quantity'], $item['unit_price'], $item['quantity'] * $item['unit_price']]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Invoice updated"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Update status
 */
function handleUpdateInvoiceStatus($pdo, $userId, $invoiceId, $status) {
    if (!$invoiceId || !$status) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID and Status required"]);
        return;
    }
    try {
        $stmt = $pdo->prepare("UPDATE invoices SET status=? WHERE id=? AND client_id IN (SELECT id FROM clients WHERE user_id=?)");
        $stmt->execute([$status, $invoiceId, $userId]);
        echo json_encode(["status" => "success", "message" => "Status updated"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Delete invoice
 */
function handleDeleteInvoice($pdo, $userId, $invoiceId) {
    if (!$invoiceId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID required"]);
        return;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM invoices WHERE id=? AND client_id IN (SELECT id FROM clients WHERE user_id=?)");
        $stmt->execute([$invoiceId, $userId]);
        echo json_encode(["status" => "success", "message" => "Invoice deleted"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
