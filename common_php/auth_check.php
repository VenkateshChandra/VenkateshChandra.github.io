<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/session.php';

start_secure_session();

$csrf_token = get_csrf_token();
$is_authenticated = is_logged_in();
$user_info = get_current_user_data();

echo json_encode([
    'authenticated' => $is_authenticated,
    'user'          => $user_info ? $user_info['username'] : null,
    'csrf_token'    => $csrf_token
]);
