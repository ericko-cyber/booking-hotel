-- Migration: Add 'used' status to voucher_claims and used_at timestamp
-- Purpose: Track when a claimed voucher is actually used in a booking

-- Add used_at column to voucher_claims table
ALTER TABLE voucher_claims ADD COLUMN used_at TIMESTAMP NULL DEFAULT NULL AFTER claimed_at;

-- Update ENUM type for status to include 'used'
ALTER TABLE voucher_claims MODIFY COLUMN status ENUM('claimed', 'used', 'cancelled') NOT NULL DEFAULT 'claimed';
