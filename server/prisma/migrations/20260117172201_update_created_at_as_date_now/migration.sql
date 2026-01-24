/*
  Warnings:

  - You are about to drop the column `created_at` on the `Contest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "created_at",
ADD COLUMN     "creatd_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TestCases" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
