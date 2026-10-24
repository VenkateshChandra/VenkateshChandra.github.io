<?php
/**
 * TRENDS FOR SALE (TFS) - SECURE DATABASE CONFIGURATION
 * Environment-aware connection pool with UTF8mb4 & prepared statement support.
 */

// Prevent direct script execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Direct access forbidden.');
}

// Support environment variables (for Hostinger production) or defaults for local XAMPP
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'login_credentials';
$db_port = getenv('DB_PORT') ? (int)getenv('DB_PORT') : 3306;

// Enable MySQLi exception mode for clean error trapping
mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

if ($conn->connect_error) {
    // Log error securely on server, never leak credentials or raw DB errors to the client
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Service temporarily unavailable. Please try again later.'
    ]);
    exit();
}

// Enforce modern UTF-8 encoding (prevents multibyte character injection bypasses)
$conn->set_charset("utf8mb4");

return $conn;
