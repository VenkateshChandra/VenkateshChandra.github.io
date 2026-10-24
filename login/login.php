<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../common_php/session.php';
require_once __DIR__ . '/../common_php/rate_limiter.php';

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

// 1. Rate Limiting Check (5 attempts max, 300s cooldown)
$rate_status = check_rate_limit('login', 5, 300);
if (!$rate_status['allowed']) {
    http_response_code(429);
    echo json_encode(["success" => false, "message" => $rate_status['message']]);
    exit();
}

// 2. CSRF Token Verification
$client_csrf = $_POST["csrf_token"] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!verify_csrf_token($client_csrf)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Security token invalid or expired. Please refresh the page."]);
    exit();
}

// 3. Input Extraction & Validation
$inputUsername = trim($_POST["username"] ?? "");
$inputPassword = $_POST["password"] ?? "";

if (empty($inputUsername) || empty($inputPassword)) {
    echo json_encode(["success" => false, "message" => "Username and password are required."]);
    exit();
}

// 4. Secure Database Query
$conn = require __DIR__ . '/../common_php/db.php';

$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An internal system error occurred."]);
    exit();
}

$stmt->bind_param("s", $inputUsername);
$stmt->execute();
$result = $stmt->get_result();

$authenticated = false;
$userData = null;

if ($row = $result->fetch_assoc()) {
    $storedHash = $row["password"];

    if (password_verify($inputPassword, $storedHash)) {
        $authenticated = true;
        $userData = $row;
    } elseif ($inputPassword === $storedHash) {
        // Upgrade legacy plaintext passwords automatically
        $authenticated = true;
        $userData = $row;
        $newHash = password_hash($inputPassword, PASSWORD_DEFAULT);
        $upgradeStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        if ($upgradeStmt) {
            $upgradeStmt->bind_param("si", $newHash, $row["id"]);
            $upgradeStmt->execute();
            $upgradeStmt->close();
        }
    }
}

$stmt->close();
$conn->close();

if ($authenticated && $userData) {
    // Reset rate limiter on success
    reset_rate_limit('login');

    // Prevent Session Fixation: Regenerate session ID and delete old session file
    session_regenerate_id(true);

    $_SESSION["user_id"] = $userData["id"];
    $_SESSION["username"] = $userData["username"];
    $_SESSION["last_activity"] = time();

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "user"    => htmlspecialchars($userData["username"], ENT_QUOTES, 'UTF-8')
    ]);
} else {
    // Record failed attempt
    record_failed_attempt('login', 5, 300);

    echo json_encode([
        "success" => false,
        "message" => "Invalid username or password."
    ]);
}
