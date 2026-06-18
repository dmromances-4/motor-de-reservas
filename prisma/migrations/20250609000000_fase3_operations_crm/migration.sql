-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');
CREATE TYPE "CampaignChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "PromoType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "PosProvider" AS ENUM ('SQUARE', 'HOLDED');
CREATE TYPE "PosIntegrationStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- Zone layout
ALTER TABLE "Zone" ADD COLUMN "layoutWidth" INTEGER NOT NULL DEFAULT 800;
ALTER TABLE "Zone" ADD COLUMN "layoutHeight" INTEGER NOT NULL DEFAULT 600;
ALTER TABLE "Zone" ADD COLUMN "backgroundUrl" TEXT;

-- Table layout
ALTER TABLE "Table" ADD COLUMN "posX" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Table" ADD COLUMN "posY" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Table" ADD COLUMN "width" DOUBLE PRECISION NOT NULL DEFAULT 80;
ALTER TABLE "Table" ADD COLUMN "height" DOUBLE PRECISION NOT NULL DEFAULT 80;
ALTER TABLE "Table" ADD COLUMN "shape" TEXT NOT NULL DEFAULT 'rect';
ALTER TABLE "Table" ADD COLUMN "rotation" INTEGER NOT NULL DEFAULT 0;

-- Guest CRM
ALTER TABLE "Guest" ADD COLUMN "lastVisitAt" TIMESTAMP(3);
ALTER TABLE "Guest" ADD COLUMN "lifetimeSpendCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Guest" ADD COLUMN "marketingEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "marketingSms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "marketingWhatsapp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "preferredLanguage" TEXT;

-- Reservation promo
ALTER TABLE "Reservation" ADD COLUMN "promoCodeId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "discountCents" INTEGER;

-- CreateTable
CREATE TABLE "GuestNote" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuestSegment" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuestSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "valuePercent" INTEGER,
    "valueCents" INTEGER,
    "minPartySize" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channels" "CampaignChannel"[],
    "segmentId" TEXT,
    "promoCodeId" TEXT,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosIntegration" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "provider" "PosProvider" NOT NULL,
    "status" "PosIntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "credentials" JSONB NOT NULL,
    "externalLocationId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PosIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosSyncLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "GuestNote_guestId_idx" ON "GuestNote"("guestId");
CREATE INDEX "GuestSegment_venueId_idx" ON "GuestSegment"("venueId");
CREATE UNIQUE INDEX "PromoCode_venueId_code_key" ON "PromoCode"("venueId", "code");
CREATE INDEX "PromoCode_venueId_idx" ON "PromoCode"("venueId");
CREATE UNIQUE INDEX "PromoRedemption_reservationId_key" ON "PromoRedemption"("reservationId");
CREATE INDEX "PromoRedemption_promoCodeId_idx" ON "PromoRedemption"("promoCodeId");
CREATE INDEX "Campaign_venueId_status_idx" ON "Campaign"("venueId", "status");
CREATE INDEX "CampaignDelivery_campaignId_idx" ON "CampaignDelivery"("campaignId");
CREATE INDEX "CampaignDelivery_guestId_idx" ON "CampaignDelivery"("guestId");
CREATE UNIQUE INDEX "PosIntegration_venueId_provider_key" ON "PosIntegration"("venueId", "provider");
CREATE INDEX "PosIntegration_venueId_idx" ON "PosIntegration"("venueId");
CREATE INDEX "PosSyncLog_integrationId_idx" ON "PosSyncLog"("integrationId");

-- ForeignKeys
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuestSegment" ADD CONSTRAINT "GuestSegment_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "GuestSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignDelivery" ADD CONSTRAINT "CampaignDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignDelivery" ADD CONSTRAINT "CampaignDelivery_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PosIntegration" ADD CONSTRAINT "PosIntegration_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PosSyncLog" ADD CONSTRAINT "PosSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "PosIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
