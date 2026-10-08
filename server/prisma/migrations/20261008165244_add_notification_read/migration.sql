-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AuditEntry" ("createdAt", "id", "text", "timestamp") SELECT "createdAt", "id", "text", "timestamp" FROM "AuditEntry";
DROP TABLE "AuditEntry";
ALTER TABLE "new_AuditEntry" RENAME TO "AuditEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
