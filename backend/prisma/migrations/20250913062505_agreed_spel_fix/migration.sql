/*
  Warnings:

  - You are about to drop the column `agrred` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "agrred",
ADD COLUMN     "agreed" BOOLEAN NOT NULL DEFAULT false;
