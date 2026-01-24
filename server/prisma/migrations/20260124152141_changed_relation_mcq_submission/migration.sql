/*
  Warnings:

  - A unique constraint covering the columns `[user_id,question_id]` on the table `McqSubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "McqSubmission_question_id_key";

-- DropIndex
DROP INDEX "McqSubmission_user_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "McqSubmission_user_id_question_id_key" ON "McqSubmission"("user_id", "question_id");
