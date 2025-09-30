-- AlterTable
ALTER TABLE "public"."Status" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "public"."StatusView" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "username" TEXT;
