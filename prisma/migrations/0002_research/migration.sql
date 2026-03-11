CREATE TABLE "ResearchSubmission" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "anonymousId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "surface" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "response" JSONB NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResearchSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
);

CREATE INDEX "ResearchSubmission_surface_createdAt_idx" ON "ResearchSubmission" ("surface", "createdAt");
CREATE INDEX "ResearchSubmission_anonymousId_createdAt_idx" ON "ResearchSubmission" ("anonymousId", "createdAt");

CREATE TABLE "ResearchEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "anonymousId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "surface" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "properties" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResearchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
);

CREATE INDEX "ResearchEvent_surface_eventName_createdAt_idx" ON "ResearchEvent" ("surface", "eventName", "createdAt");
CREATE INDEX "ResearchEvent_anonymousId_createdAt_idx" ON "ResearchEvent" ("anonymousId", "createdAt");
