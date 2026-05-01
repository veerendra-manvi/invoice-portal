-- ==========================================================
-- Database Schema: Small Business Invoice & Billing Portal
-- ==========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ----------------------------------------------------------
-- 1. Table: users
-- Stores administrative users who can manage invoices.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL, -- To store hashed passwords
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 2. Table: clients
-- Stores information about customers/clients.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL, -- The user who added this client
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 3. Table: invoices
-- Stores the header information for each invoice.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_id` INT NOT NULL,
    `invoice_number` VARCHAR(20) NOT NULL UNIQUE, -- E.g., INV-2024-001
    `issue_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    `subtotal` DECIMAL(15, 2) DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) DEFAULT 0.00,
    `total` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 4. Table: invoice_items
-- Stores line items for each invoice.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` INT NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL, -- quantity * unit_price
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 5. Table: payments
-- Stores payment transactions made against invoices.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` INT NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_date` DATE NOT NULL,
    `payment_method` VARCHAR(50) DEFAULT 'Bank Transfer', -- E.g., Cash, Credit Card, PayPal
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SAMPLE DATA
-- ==========================================================

-- Sample User (password: password123)
INSERT INTO `users` (`username`, `email`, `password`) VALUES 
('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Sample Client
INSERT INTO `clients` (`user_id`, `name`, `email`, `phone`, `address`) VALUES 
(1, 'John Doe Corp', 'john@doecorp.com', '123-456-7890', '123 Business Way, New York, NY');

-- Sample Invoice
INSERT INTO `invoices` (`client_id`, `invoice_number`, `issue_date`, `due_date`, `status`, `total_amount`) VALUES 
(1, 'INV-2024-001', '2024-04-01', '2024-04-15', 'Sent', 1500.00);

-- Sample Invoice Items
INSERT INTO `invoice_items` (`invoice_id`, `description`, `quantity`, `unit_price`, `total_price`) VALUES 
(1, 'Web Design Services', 1, 1000.00, 1000.00),
(1, 'Logo Design', 1, 500.00, 500.00);

-- Sample Payment
INSERT INTO `payments` (`invoice_id`, `amount`, `payment_date`, `payment_method`) VALUES 
(1, 500.00, '2024-04-05', 'Credit Card');
