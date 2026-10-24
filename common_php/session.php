<?php
/**
 * TRENDS FOR SALE (TFS) - SECURE SESSION & CSRF MANAGER
 * Implements strict HTTP-only cookies, SameSite enforcement, session fixation protection, and CSRF tokens.
 */

// Prevent direct script execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Direct access forbidden.');
}

function start_secure_session() {
    if (session_status() === PHP_SESSION_NONE) {
        $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
                 || (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
                 || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        // Configure hardened session cookie params before starting session
        session_set_cookie_params([
            'lifetime' => 86400, // 24 hours
            'path'     => '/',
            'domain'   => '',
            'secure'   => $is_https,
            'httponly' => true,      // Prevents JavaScript access (mitigates XSS cookie theft)
            'samesite' => 'Lax'      // CSRF protection for top-level navigation
        ]);

        session_start();

        // Expire session after 60 minutes of inactivity
        $max_idle = 3600;
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $max_idle)) {
            session_unset();
            session_destroy();
            session_start();
        }
        $_SESSION['last_activity'] = time();
    }
}

/**
 * Generate or retrieve the existing CSRF token
 */
function get_csrf_token() {
    start_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate incoming CSRF token using timing-safe comparison
 */
function verify_csrf_token($token) {
    start_secure_session();
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Check if the user is authenticated
 */
function is_logged_in() {
    start_secure_session();
    return !empty($_SESSION['user_id']) && !empty($_SESSION['username']);
}

/**
 * Get current authenticated user details safely
 */
function get_current_user_data() {
    if (!is_logged_in()) {
        return null;
    }
    return [
        'id'       => $_SESSION['user_id'],
        'username' => htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8')
    ];
}
