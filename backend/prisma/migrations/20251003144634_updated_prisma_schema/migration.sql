/*
  Warnings:

  - You are about to drop the column `lastMsgId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `unreadCount` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the `_ConversationToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_lastMsgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConversationToUser" DROP CONSTRAINT "_ConversationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConversationToUser" DROP CONSTRAINT "_ConversationToUser_B_fkey";

-- DropIndex
DROP INDEX "public"."Conversation_lastMsgId_key";

-- AlterTable
ALTER TABLE "public"."Conversation" DROP COLUMN "lastMsgId",
DROP COLUMN "unreadCount";

-- DropTable
DROP TABLE "public"."_ConversationToUser";

-- CreateTable
CREATE TABLE "public"."ConversationParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastMsgId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_userId_conversationId_key" ON "public"."ConversationParticipant"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_lastMsgId_fkey" FOREIGN KEY ("lastMsgId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
