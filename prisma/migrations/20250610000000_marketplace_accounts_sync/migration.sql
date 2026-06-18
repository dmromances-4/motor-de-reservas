-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STAFF', 'DINER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "commissionAmountCents" INTEGER,
ADD COLUMN     "depositAmountCents" INTEGER,
ADD COLUMN     "depositStatus" "PaymentStatus",
ADD COLUMN     "dinerUserId" TEXT,
ADD COLUMN     "loyaltyPointsAwarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Venue" RENAME CONSTRAINT "Restaurant_pkey" TO "Venue_pkey";
ALTER TABLE "Venue" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fiftyBestRank" INTEGER,
ADD COLUMN     "marketplaceCommissionBps" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "michelinStars" INTEGER,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_venueId_key" ON "Favorite"("userId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_stripeEventId_key" ON "PaymentEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_reservationId_idx" ON "PaymentEvent"("reservationId");

-- CreateIndex
CREATE INDEX "Reservation_dinerUserId_idx" ON "Reservation"("dinerUserId");

-- CreateIndex
CREATE INDEX "Reservation_source_idx" ON "Reservation"("source");

-- CreateIndex
CREATE INDEX "Review_venueId_idx" ON "Review"("venueId");

-- CreateIndex
CREATE INDEX "Venue_isListedOnMarketplace_city_idx" ON "Venue"("isListedOnMarketplace", "city");

-- RenameForeignKey
ALTER TABLE "Venue" RENAME CONSTRAINT "Restaurant_organizationId_fkey" TO "Venue_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_dinerUserId_fkey" FOREIGN KEY ("dinerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Restaurant_organizationId_idx" RENAME TO "Venue_organizationId_idx";

-- RenameIndex
ALTER INDEX "Restaurant_slug_key" RENAME TO "Venue_slug_key";
