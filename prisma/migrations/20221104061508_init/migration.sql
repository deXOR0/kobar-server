-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "problemId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "inputFormat" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "exampleCount" INTEGER NOT NULL,
    "reviewVideoURL" TEXT NOT NULL,
    "reviewText" TEXT NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleInvitation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,

    CONSTRAINT "BattleInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionTest" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "output" TEXT NOT NULL,
    "outputType" TEXT NOT NULL,
    "performance" INTEGER NOT NULL,

    CONSTRAINT "SubmissionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersOnBattles" (
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readyToBattle" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UsersOnBattles_pkey" PRIMARY KEY ("battleId","userId")
);

-- CreateTable
CREATE TABLE "BattleEvaluation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "correctness" INTEGER NOT NULL,
    "performance" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    "resultId" TEXT NOT NULL,

    CONSTRAINT "BattleEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleResult" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "winnerId" TEXT,
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL,

    CONSTRAINT "BattleResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "BattleInvitation_inviteCode_key" ON "BattleInvitation"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Battle_inviteCode_key" ON "Battle"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "BattleResult_battleId_key" ON "BattleResult"("battleId");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleInvitation" ADD CONSTRAINT "BattleInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionTest" ADD CONSTRAINT "SubmissionTest_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionTest" ADD CONSTRAINT "SubmissionTest_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnBattles" ADD CONSTRAINT "UsersOnBattles_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnBattles" ADD CONSTRAINT "UsersOnBattles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleEvaluation" ADD CONSTRAINT "BattleEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleEvaluation" ADD CONSTRAINT "BattleEvaluation_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "BattleResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleResult" ADD CONSTRAINT "BattleResult_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleResult" ADD CONSTRAINT "BattleResult_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
