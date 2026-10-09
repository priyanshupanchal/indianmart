<?php
/**
 * Indian Mart — Database Configuration
 * Edit DB_HOST, DB_USER, DB_PASS, DB_NAME to match your server.
 */

// ── Database Credentials ───────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');                  // XAMPP default = empty | WAMP = empty
define('DB_NAME', 'indianmart');
define('DB_CHARSET', 'utf8mb4');

// ── App Settings ───────────────────────────────────────────────────────────
define('APP_NAME',    'Indian Mart');
define('APP_URL',     'http://localhost/e-commerce%20website/luxenova'); // Adjust path
define('SITE_EMAIL',  'noreply@indianmart.in');

// ── Session Settings ───────────────────────────────────────────────────────
define('SESSION_NAME',     'IM_SESSION');
define('REMEMBER_DURATION', 30 * 24 * 60 * 60); // 30 days in seconds
define('MAX_LOGIN_ATTEMPTS', 5);                 // Lock after 5 failed attempts
define('LOCKOUT_DURATION',   15 * 60);           // 15 minutes lockout

// ── Environment ────────────────────────────────────────────────────────────
define('APP_ENV', 'development'); // 'development' | 'production'

// ── Error Reporting ─────────────────────────────────────────────────────────
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ── Create PDO Database Connection ────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Show friendly error — never expose raw PDO error in production
            $msg = APP_ENV === 'development'
                ? htmlspecialchars($e->getMessage())
                : 'Could not connect to the database. Please try again later.';
            die(<<<HTML
            <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
            <title>Database Error — Indian Mart</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body{background:#06091a;color:#f5f0e8;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
              .box{background:rgba(255,107,35,.08);border:1px solid rgba(255,107,35,.3);border-radius:16px;padding:40px;max-width:480px;text-align:center}
              h2{color:#ff6b23;margin-bottom:12px}p{color:rgba(245,240,232,.6);font-size:.9rem}
              a{color:#ff8c42;text-decoration:none;font-weight:600}
            </style></head><body>
            <div class="box">
              <h2>⚠️ Database Connection Error</h2>
              <p>$msg</p>
              <p style="margin-top:16px"><a href="index.html">← Back to Indian Mart</a></p>
            </div></body></html>
            HTML);
        }
    }
    return $pdo;
}

// ── Start Secure Session ───────────────────────────────────────────────────
function startSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => false,   // Set true in production (HTTPS)
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
        // Regenerate ID periodically to prevent fixation
        if (!isset($_SESSION['_created'])) {
            session_regenerate_id(true);
            $_SESSION['_created'] = time();
        } elseif (time() - $_SESSION['_created'] > 1800) {
            session_regenerate_id(true);
            $_SESSION['_created'] = time();
        }
    }
}

// ── CSRF Token Helpers ─────────────────────────────────────────────────────
function csrfToken(): string {
    startSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(): void {
    $token   = $_POST['csrf_token'] ?? '';
    $session = $_SESSION['csrf_token'] ?? '';
    if (!$token || !hash_equals($session, $token)) {
        jsonError('Invalid request. Please refresh and try again.', 403);
    }
}

// ── JSON Response Helpers ─────────────────────────────────────────────────
function jsonSuccess(string $message, array $data = [], string $redirect = ''): never {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data, 'redirect' => $redirect]);
    exit;
}

function jsonError(string $message, int $code = 400, array $errors = []): never {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => $message, 'errors' => $errors]);
    exit;
}

// ── Auth Helpers ───────────────────────────────────────────────────────────
function isLoggedIn(): bool {
    startSession();
    return !empty($_SESSION['user_id']);
}

function requireLogin(string $redirect = 'login.php'): void {
    if (!isLoggedIn()) {
        header("Location: $redirect");
        exit;
    }
}

function currentUser(): ?array {
    if (!isLoggedIn()) return null;
    static $user = null;
    if ($user === null) {
        $pdo  = getDB();
        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, mobile, avatar FROM users WHERE id = ? AND is_active = 1');
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch() ?: null;
    }
    return $user;
}

// ── Login Attempt Rate Limiter ─────────────────────────────────────────────
function checkRateLimit(string $identifier): bool {
    $pdo  = getDB();
    $from = date('Y-m-d H:i:s', time() - LOCKOUT_DURATION);
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM login_attempts WHERE identifier = ? AND attempted_at > ?'
    );
    $stmt->execute([$identifier, $from]);
    return (int)$stmt->fetchColumn() < MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(string $identifier): void {
    $pdo  = getDB();
    $ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $stmt = $pdo->prepare('INSERT INTO login_attempts (identifier, ip_address) VALUES (?, ?)');
    $stmt->execute([$identifier, $ip]);
}

function clearAttempts(string $identifier): void {
    $pdo  = getDB();
    $stmt = $pdo->prepare('DELETE FROM login_attempts WHERE identifier = ?');
    $stmt->execute([$identifier]);
}

// ── Remember Me ────────────────────────────────────────────────────────────
function setRememberMe(int $userId): void {
    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expires   = date('Y-m-d H:i:s', time() + REMEMBER_DURATION);

    $pdo  = getDB();
    $stmt = $pdo->prepare('INSERT INTO remember_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $tokenHash, $expires]);

    setcookie('remember_me', $token, [
        'expires'  => time() + REMEMBER_DURATION,
        'path'     => '/',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function checkRememberMe(): void {
    if (isLoggedIn() || empty($_COOKIE['remember_me'])) return;
    $tokenHash = hash('sha256', $_COOKIE['remember_me']);
    $pdo  = getDB();
    $stmt = $pdo->prepare(
        'SELECT user_id FROM remember_tokens
         WHERE token_hash = ? AND expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();
    if ($row) {
        startSession();
        $_SESSION['user_id']    = $row['user_id'];
        $_SESSION['_created']   = time();
        // Update last login
        $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$row['user_id']]);
    }
}

// ── Sanitize Input ─────────────────────────────────────────────────────────
function sanitize(string $value): string {
    return htmlspecialchars(trim($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// ── Auto-check remember cookie on every page load ─────────────────────────
startSession();
checkRememberMe();
