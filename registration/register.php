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

// 1. Rate Limiting Check (10 registration attempts per hour max)
$rate_status = check_rate_limit('register', 10, 3600);
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

// 3. Input Extraction & Sanitization
$firstName    = trim($_POST["firstName"] ?? "");
$lastName     = trim($_POST["lastName"] ?? "");
$mobileNumber = trim($_POST["mobileNumber"] ?? "");
$dateOfBirth  = trim($_POST["dateOfBirth"] ?? "");
$username_id  = trim($_POST["username"] ?? "");
$rawPassword  = $_POST["password"] ?? "";

// 4. Strict Validation
if (empty($username_id) || empty($rawPassword)) {
    echo json_encode(["success" => false, "message" => "Username and password are required."]);
    exit();
}

// Username regex check (3 to 30 alphanumeric characters and underscores)
if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username_id)) {
    echo json_encode(["success" => false, "message" => "Username must be 3-30 characters long and contain only letters, numbers, and underscores."]);
    exit();
}

// Password strength check (min 8 chars, max 128 chars)
if (strlen($rawPassword) < 8 || strlen($rawPassword) > 128) {
    echo json_encode(["success" => false, "message" => "Password must be between 8 and 128 characters long."]);
    exit();
}

// Mobile number check
if (!empty($mobileNumber) && !preg_match('/^[0-9+\s\-()]{7,20}$/', $mobileNumber)) {
    echo json_encode(["success" => false, "message" => "Please enter a valid phone number."]);
    exit();
}

// Date of birth format check (YYYY-MM-DD)
if (!empty($dateOfBirth) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth)) {
    echo json_encode(["success" => false, "message" => "Invalid date of birth format."]);
    exit();
}

// Truncate names to database safe length (max 50 chars)
$firstName = mb_substr($firstName, 0, 50, 'UTF-8');
$lastName  = mb_substr($lastName, 0, 50, 'UTF-8');

// 5. Database Interaction
$conn = require __DIR__ . '/../common_php/db.php';

// Check for existing username
$checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
if (!$checkStmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "System error while verifying account."]);
    exit();
}

$checkStmt->bind_param("s", $username_id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    $checkStmt->close();
    $conn->close();
    record_failed_attempt('register', 10, 3600);
    echo json_encode(["success" => false, "message" => "Username is already taken. Please choose another."]);
    exit();
}
$checkStmt->close();

// Securely hash password with modern Bcrypt/Argon2
$hashedPassword = password_hash($rawPassword, PASSWORD_DEFAULT);

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (first_name, last_name, mobile_number, date_of_birth, username, password) VALUES (?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to prepare user creation statement."]);
    exit();
}

$stmt->bind_param("ssssss", $firstName, $lastName, $mobileNumber, $dateOfBirth, $username_id, $hashedPassword);

if ($stmt->execute()) {
    reset_rate_limit('register');
    echo json_encode([
        "success" => true,
        "message" => "Registration successful! You may now sign in."
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred while creating your account."]);
}

$stmt->close();
$conn->close();
?>
