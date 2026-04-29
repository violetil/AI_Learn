-- Add assignment question for clearer prompts
ALTER TABLE "assignment" ADD COLUMN "question" TEXT;

-- Add structured review fields to study records
ALTER TABLE "study_record" ADD COLUMN "reviewStatus" TEXT;
ALTER TABLE "study_record" ADD COLUMN "reviewComment" TEXT;
ALTER TABLE "study_record" ADD COLUMN "reviewScore" INTEGER;
ALTER TABLE "study_record" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "study_record" ADD COLUMN "reviewerId" TEXT;
