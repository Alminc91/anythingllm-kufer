/*
  Warnings:

  - You are about to drop the column `messageLimit` on the `workspaces` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workspaces" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vectorTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiTemp" REAL,
    "openAiHistory" INTEGER NOT NULL DEFAULT 20,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiPrompt" TEXT,
    "similarityThreshold" REAL DEFAULT 0.25,
    "chatProvider" TEXT,
    "chatModel" TEXT,
    "topN" INTEGER DEFAULT 4,
    "chatMode" TEXT DEFAULT 'chat',
    "pfpFilename" TEXT,
    "agentProvider" TEXT,
    "agentModel" TEXT,
    "queryRefusalResponse" TEXT,
    "vectorSearchMode" TEXT DEFAULT 'default',
    "messagesLimit" INTEGER
);
INSERT INTO "new_workspaces" ("agentModel", "agentProvider", "chatMode", "chatModel", "chatProvider", "createdAt", "id", "lastUpdatedAt", "name", "openAiHistory", "openAiPrompt", "openAiTemp", "pfpFilename", "queryRefusalResponse", "similarityThreshold", "slug", "topN", "vectorSearchMode", "vectorTag") SELECT "agentModel", "agentProvider", "chatMode", "chatModel", "chatProvider", "createdAt", "id", "lastUpdatedAt", "name", "openAiHistory", "openAiPrompt", "openAiTemp", "pfpFilename", "queryRefusalResponse", "similarityThreshold", "slug", "topN", "vectorSearchMode", "vectorTag" FROM "workspaces";
DROP TABLE "workspaces";
ALTER TABLE "new_workspaces" RENAME TO "workspaces";
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
