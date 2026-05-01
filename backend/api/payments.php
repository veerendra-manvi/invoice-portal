<?php
/**
 * Payments API
 * Handles recording and fetching payments
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

$userId = $user_id; // For consistency with rest of the script

$method = $_SERVER['REQUEST_METHOD'];
$invoiceId = isset($_GET['invoice_id']) ? intval($_GET['invoice_id']) : null;
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if ($invoiceId) {
            handleGetPayments($pdo, $userId, $invoiceId);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invoice ID is required"]);
        }
        break;
    case 'POST':
        handleRecordPayment($pdo, $userId, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        break;
}

/**
 * Fetch all payments for a specific invoice
 */
function handleGetPayments($pdo, $userId, $invoiceId) {
    try {
        // Verify invoice ownership
        $stmt = $pdo->prepare("SELECT i.id FROM invoices i 
                               JOIN clients c ON i.client_id = c.id 
                               WHERE i.id = ? AND c.user_id = ?");
        $stmt->execute([$invoiceId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Invoice not found or access denied"]);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC");
        $stmt->execute([$invoiceId]);
        $payments = $stmt->fetchAll();

        echo json_encode(["status" => "success", "data" => $payments]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

/**
 * Record a new payment and update invoice status if fully paid
 */
function handleRecordPayment($pdo, $userId, $input) {
    $invoiceId = isset($input['invoice_id']) ? intval($input['invoice_id']) : null;
    $amount = isset($input['amount']) ? floatval($input['amount']) : 0;
    $paymentDate = isset($input['payment_date']) ? $input['payment_date'] : date('Y-m-d');
    $paymentMethod = isset($input['method']) ? $input['method'] : 'Cash';

    if (!$invoiceId || $amount <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invoice ID and a positive amount are required"]);
        return;
    }

    try {
        // Verify invoice ownership
        $stmt = $pdo->prepare("SELECT i.id, i.total, i.status FROM invoices i 
                               JOIN clients c ON i.client_id = c.id 
                               WHERE i.id = ? AND c.user_id = ?");
        $stmt->execute([$invoiceId, $userId]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Invoice not found or access denied"]);
            return;
        }

        $pdo->beginTransaction();

        // Insert Payment
        $stmt = $pdo->prepare("INSERT INTO payments (invoice_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)");
        $stmt->execute([$invoiceId, $amount, $paymentDate, $paymentMethod]);

        // Calculate total paid
        $stmt = $pdo->prepare("SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?");
        $stmt->execute([$invoiceId]);
        $totalPaid = $stmt->fetch()['total_paid'];

        // Update invoice status if fully paid
        if ($totalPaid >= $invoice['total']) {
            $updateStmt = $pdo->prepare("UPDATE invoices SET status = 'Paid' WHERE id = ?");
            $updateStmt->execute([$invoiceId]);
        }

        $pdo->commit();

        echo json_encode([
            "status" => "success", 
            "message" => "Payment recorded",
            "total_paid" => $totalPaid,
            "status_updated" => ($totalPaid >= $invoice['total'] ? 'Paid' : $invoice['status'])
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
