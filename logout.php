<?php
/**
 * Indian Mart — Logout Handler (logout.php)
 * Clears session and remember-me cookie, then redirects.
 */
require_once __DIR__ . '/config.php';

startSession();

// Delete remember_me token from DB if present
if (!empty($_COOKIE['remember_me']) && !empty($_SESSION['user_id'])) {
    $tokenHash = hash('sha256', $_COOKIE['remember_me']);
    $pdo  = getDB();
    $stmt = $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ? AND token_hash = ?');
    $stmt->execute([$_SESSION['user_id'], $tokenHash]);
}

// Destroy session
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

// Clear remember-me cookie
setcookie('remember_me', '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Lax',
]);

// Redirect with flash message
session_start();
$_SESSION['flash_success'] = 'You have been logged out successfully. See you soon! 👋';
header('Location: login.php');
exit;
