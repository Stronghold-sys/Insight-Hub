-- ============================================================
-- MIGRATION: OTP Auth System
-- Jalankan script ini di database pemahaman
-- ============================================================

-- 1. Pastikan kolom email_verified & is_active ada di users
ALTER TABLE users
  MODIFY COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0,
  MODIFY COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Buat tabel otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(6)   NOT NULL,
  purpose     ENUM('register','forgot_password') NOT NULL DEFAULT 'register',
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL DEFAULT NULL,
  resend_count INT          NOT NULL DEFAULT 0,
  last_resend_at DATETIME  NULL DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email_purpose (email, purpose),
  INDEX idx_otp_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel untuk menyimpan reset password token sementara (setelah OTP valid)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  token       VARCHAR(64)  NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_token (token),
  INDEX idx_reset_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
