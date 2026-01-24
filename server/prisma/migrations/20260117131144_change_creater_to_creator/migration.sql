/*
  Warnings:

  - You are about to drop the column `creater_id` on the `Contest` table. All the data in the column will be lost.
  - Added the required column `creator_id` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contest" DROP CONSTRAINT "Contest_creater_id_fkey";

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "creater_id",
ADD COLUMN     "creator_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
