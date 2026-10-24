<?php
/**
 * TRENDS FOR SALE (TFS) - BRUTE FORCE & RATE LIMITER
 * Protects login and authentication endpoints from automated password-guessing attacks.
 */

// Prevent direct script execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Direct access forbidden.');
}

require_once __DIR__ . '/session.php';

function check_rate_limit($action = 'login', $max_attempts = 5, $lockout_seconds = 300) {
    start_secure_session();

    $key = 'rate_limit_' . $action;
    $now = time();

    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [
            'attempts'     => 0,
            'lockout_time' => 0
        ];
    }

    $state = &$_SESSION[$key];

    // Check if currently locked out
    if ($state['lockout_time'] > $now) {
        $remaining = $state['lockout_time'] - $now;
        return [
            'allowed'   => false,
            'remaining' => $remaining,
            'message'   => "Too many failed attempts. Please wait {$remaining} seconds before trying again."
        ];
    }

    // Lockout expired, reset attempts
    if ($state['lockout_time'] > 0 && $state['lockout_time'] <= $now) {
        $state['attempts'] = 0;
        $state['lockout_time'] = 0;
    }

    return ['allowed' => true];
}

function record_failed_attempt($action = 'login', $max_attempts = 5, $lockout_seconds = 300) {
    start_secure_session();
    $key = 'rate_limit_' . $action;

    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['attempts' => 0, 'lockout_time' => 0];
    }

    $_SESSION[$key]['attempts']++;

    if ($_SESSION[$key]['attempts'] >= $max_attempts) {
        $_SESSION[$key]['lockout_time'] = time() + $lockout_seconds;
    }
}

function reset_rate_limit($action = 'login') {
    start_secure_session();
    unset($_SESSION['rate_limit_' . $action]);
}
