-- ═══════════════════════════════════════════════════════════════════
--  Indian Mart — MySQL Database Schema
--  Run this in phpMyAdmin or MySQL CLI:
--    mysql -u root -p < db.sql
-- ═══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS indianmart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE indianmart;
-- ── Users Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(60)     NOT NULL,
  last_name     VARCHAR(60)     NOT NULL,
  email         VARCHAR(180)    NOT NULL UNIQUE,
  mobile        VARCHAR(15)     NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  referral_code VARCHAR(20)     DEFAULT NULL,
  avatar        VARCHAR(255)    DEFAULT NULL,
  is_verified   TINYINT(1)      NOT NULL DEFAULT 0,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  receive_offers TINYINT(1)     NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login    DATETIME        DEFAULT NULL,
  INDEX idx_email  (email),
  INDEX idx_mobile (mobile)
) ENGINE=InnoDB;

-- ── Remember Me Tokens ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS remember_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_user  (user_id)
) ENGINE=InnoDB;

-- ── Login Attempts (rate limiting) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,   -- email or IP
  ip_address VARCHAR(45)  NOT NULL,
  attempted_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_identifier (identifier),
  INDEX idx_attempted  (attempted_at)
) ENGINE=InnoDB;

-- ── Password Reset Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Sample Demo User (password: Demo@1234) ─────────────────────────
INSERT IGNORE INTO users
  (first_name, last_name, email, mobile, password_hash, is_verified)
VALUES (
  'Demo',
  'User',
  'demo@indianmart.in',
  '9999999999',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1
);
