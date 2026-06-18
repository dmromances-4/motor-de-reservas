-- Add new reservation sources for real channel integrations
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'GOOGLE';
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'OPENTABLE';
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'THEFORK';
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'INSTAGRAM';
