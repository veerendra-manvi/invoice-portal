<?php
/**
 * Dashboard Stats API
 * NOTE: Using user_id instead of session due to hosting limitation
 */

// REMOVE any Authorization header/token/session check
// session_start(); // Session removed for InfinityFree compatibility
require_once '../config/db.php';

// 3. Simple user_id validation
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "User ID required"
    ]);
    exit();
}

try {
    // 4. Update all SQL queries to filter by user_id
    // 1. Total Revenue (Sum of all payments)
    $stmt = $pdo->prepare("SELECT SUM(p.amount) as total 
                           FROM payments p 
                           JOIN invoices i ON p.invoice_id = i.id 
                           JOIN clients c ON i.client_id = c.id 
                           WHERE c.user_id = ?");
    $stmt->execute([$user_id]);
    $totalRevenue = $stmt->fetch()['total'] ?? 0;

    // 2. Pending Amount (Sum of total - payments for unpaid/uncancelled invoices)
    $stmt = $pdo->prepare("SELECT SUM(i.total) as total 
                           FROM invoices i 
                           JOIN clients c ON i.client_id = c.id 
                           WHERE c.user_id = ? AND i.status NOT IN ('Paid', 'Cancelled')");
    $stmt->execute([$user_id]);
    $pendingAmount = $stmt->fetch()['total'] ?? 0;

    // 3. Overdue Invoices Count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count 
                           FROM invoices i 
                           JOIN clients c ON i.client_id = c.id 
                           WHERE c.user_id = ? AND i.status = 'Overdue'");
    $stmt->execute([$user_id]);
    $overdueCount = $stmt->fetch()['count'] ?? 0;

    // 4. Total Clients
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM clients WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $totalClients = $stmt->fetch()['count'] ?? 0;

    // 5. Recent Invoices
    $stmt = $pdo->prepare("SELECT i.*, c.name as client_name 
                           FROM invoices i 
                           JOIN clients c ON i.client_id = c.id 
                           WHERE c.user_id = ? 
                           ORDER BY i.created_at DESC 
                           LIMIT 5");
    $stmt->execute([$user_id]);
    $recentInvoices = $stmt->fetchAll();

    // 6. Return JSON response
    echo json_encode([
        "status" => "success",
        "data" => [
            "total_revenue" => $totalRevenue,
            "pending_amount" => $pendingAmount,
            "overdue_invoices" => $overdueCount,
            "total_clients" => $totalClients,
            "recent_invoices" => $recentInvoices
        ]
    ]);

} catch (PDOException $e) {
    // 7. Use 500 for server error
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
