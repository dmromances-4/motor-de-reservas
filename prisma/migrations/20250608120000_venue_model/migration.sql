-- Rename main table
ALTER TABLE "Restaurant" RENAME TO "Venue";

-- New enums
CREATE TYPE "AverageTicketRange" AS ENUM ('LT_15', 'RANGE_15_30', 'RANGE_30_50', 'GT_50');
CREATE TYPE "DressCode" AS ENUM ('CASUAL', 'SMART_CASUAL', 'FORMAL', 'ELEGANT', 'NO_REQUIREMENT');

-- New Venue columns
ALTER TABLE "Venue" ADD COLUMN "establishmentTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "cuisineTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "signatureDishes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "idealFor" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "venueFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "Venue" ADD COLUMN "averageTicketRange" "AverageTicketRange";
ALTER TABLE "Venue" ADD COLUMN "hasDailyMenu" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Venue" ADD COLUMN "dailyMenuDescription" TEXT;
ALTER TABLE "Venue" ADD COLUMN "awardBadges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Venue" ADD COLUMN "tripAdvisorUrl" TEXT;
ALTER TABLE "Venue" ADD COLUMN "theForkUrl" TEXT;
ALTER TABLE "Venue" ADD COLUMN "tiktokUrl" TEXT;
ALTER TABLE "Venue" ADD COLUMN "preferenceTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Venue" ADD COLUMN "dressCode" "DressCode";

-- Migrate legacy data
UPDATE "Venue" SET "cuisineTypes" = ARRAY["cuisineType"] WHERE "cuisineType" IS NOT NULL AND "cuisineType" <> '';
UPDATE "Venue" SET "averageTicketRange" = CASE "priceRange"
  WHEN 1 THEN 'LT_15'::"AverageTicketRange"
  WHEN 2 THEN 'RANGE_15_30'::"AverageTicketRange"
  WHEN 3 THEN 'RANGE_30_50'::"AverageTicketRange"
  WHEN 4 THEN 'GT_50'::"AverageTicketRange"
  ELSE NULL END WHERE "priceRange" IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Venue'
      AND column_name = 'guideBadges'
  ) THEN
    UPDATE "Venue"
    SET "awardBadges" = "guideBadges"
    WHERE array_length("guideBadges", 1) > 0;
    ALTER TABLE "Venue" DROP COLUMN "guideBadges";
  END IF;
END $$;

ALTER TABLE "Venue" DROP COLUMN IF EXISTS "cuisineType";
ALTER TABLE "Venue" DROP COLUMN IF EXISTS "priceRange";

-- Rename FK columns (Favorite may not exist on fresh init databases)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Favorite', 'Membership', 'Service', 'ClosureException', 'Zone',
    'Guest', 'Reservation', 'WaitlistEntry', 'AvailabilityBlock',
    'NotificationLog', 'Review'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'restaurantId'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I RENAME COLUMN "restaurantId" TO "venueId"',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Rename indexes (PostgreSQL keeps old names after column rename)
ALTER INDEX IF EXISTS "Membership_restaurantId_idx" RENAME TO "Membership_venueId_idx";
ALTER INDEX IF EXISTS "Membership_userId_restaurantId_key" RENAME TO "Membership_userId_venueId_key";
ALTER INDEX IF EXISTS "Service_restaurantId_idx" RENAME TO "Service_venueId_idx";
ALTER INDEX IF EXISTS "ClosureException_restaurantId_date_key" RENAME TO "ClosureException_venueId_date_key";
ALTER INDEX IF EXISTS "Zone_restaurantId_idx" RENAME TO "Zone_venueId_idx";
ALTER INDEX IF EXISTS "Guest_restaurantId_email_idx" RENAME TO "Guest_venueId_email_idx";
ALTER INDEX IF EXISTS "Guest_restaurantId_phone_idx" RENAME TO "Guest_venueId_phone_idx";
ALTER INDEX IF EXISTS "Reservation_restaurantId_dateTime_status_idx" RENAME TO "Reservation_venueId_dateTime_status_idx";
ALTER INDEX IF EXISTS "Reservation_restaurantId_status_idx" RENAME TO "Reservation_venueId_status_idx";
ALTER INDEX IF EXISTS "WaitlistEntry_restaurantId_date_idx" RENAME TO "WaitlistEntry_venueId_date_idx";
ALTER INDEX IF EXISTS "AvailabilityBlock_restaurantId_startTime_endTime_idx" RENAME TO "AvailabilityBlock_venueId_startTime_endTime_idx";

-- Rename FK constraints
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (VALUES
      ('Membership', 'Membership_restaurantId_fkey', 'Membership_venueId_fkey'),
      ('Service', 'Service_restaurantId_fkey', 'Service_venueId_fkey'),
      ('ClosureException', 'ClosureException_restaurantId_fkey', 'ClosureException_venueId_fkey'),
      ('Zone', 'Zone_restaurantId_fkey', 'Zone_venueId_fkey'),
      ('Guest', 'Guest_restaurantId_fkey', 'Guest_venueId_fkey'),
      ('Reservation', 'Reservation_restaurantId_fkey', 'Reservation_venueId_fkey'),
      ('WaitlistEntry', 'WaitlistEntry_restaurantId_fkey', 'WaitlistEntry_venueId_fkey'),
      ('AvailabilityBlock', 'AvailabilityBlock_restaurantId_fkey', 'AvailabilityBlock_venueId_fkey'),
      ('NotificationLog', 'NotificationLog_restaurantId_fkey', 'NotificationLog_venueId_fkey'),
      ('Review', 'Review_restaurantId_fkey', 'Review_venueId_fkey')
    ) AS t(table_name, old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = rec.old_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
        rec.table_name,
        rec.old_name,
        rec.new_name
      );
    END IF;
  END LOOP;
END $$;
