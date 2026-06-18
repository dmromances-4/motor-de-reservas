-- Venue: geo + Google + media enablers
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "businessHours" JSONB;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "menuUrl" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "galleryUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Venue_latitude_longitude_idx" ON "Venue"("latitude", "longitude");

-- User: referral code + loyalty ledger relations
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- IntegrationConnection
CREATE TABLE IF NOT EXISTS "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "credentials" JSONB,
    "externalId" TEXT,
    "metadata" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationConnection_venueId_provider_key" ON "IntegrationConnection"("venueId", "provider");
CREATE INDEX IF NOT EXISTS "IntegrationConnection_venueId_idx" ON "IntegrationConnection"("venueId");
ALTER TABLE "IntegrationConnection" DROP CONSTRAINT IF EXISTS "IntegrationConnection_venueId_fkey";
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LoyaltyTransaction
CREATE TABLE IF NOT EXISTS "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_userId_idx" ON "LoyaltyTransaction"("userId");
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT IF EXISTS "LoyaltyTransaction_userId_fkey";
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reward
CREATE TABLE IF NOT EXISTS "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERK',
    "valueCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- RewardRedemption
CREATE TABLE IF NOT EXISTS "RewardRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RewardRedemption_code_key" ON "RewardRedemption"("code");
CREATE INDEX IF NOT EXISTS "RewardRedemption_userId_idx" ON "RewardRedemption"("userId");
ALTER TABLE "RewardRedemption" DROP CONSTRAINT IF EXISTS "RewardRedemption_userId_fkey";
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" DROP CONSTRAINT IF EXISTS "RewardRedemption_rewardId_fkey";
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Referral
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredEmail" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
ALTER TABLE "Referral" DROP CONSTRAINT IF EXISTS "Referral_referrerId_fkey";
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" DROP CONSTRAINT IF EXISTS "Referral_referredUserId_fkey";
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
