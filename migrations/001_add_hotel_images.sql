-- Migration: Add image support to hotels table
-- Purpose: Store featured image URL for each hotel
-- Date: 2026

-- Add image_url column to hotels table
ALTER TABLE `hotels` ADD COLUMN `image_url` varchar(255) AFTER `website`;

-- Add featured image URL to room_images display
-- (room_images already has image_url field, no change needed)

-- Sample data update (optional - replace with actual image URLs)
-- UPDATE `hotels` SET `image_url` = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80' WHERE `id` = 1;
