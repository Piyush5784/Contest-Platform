-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'CREDENTIALS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'CREDENTIALS',
ALTER COLUMN "password_hash" DROP NOT NULL;
