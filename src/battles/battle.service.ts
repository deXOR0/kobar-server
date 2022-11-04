import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from 'src/prisma.service';
import {
    User as UserModel,
    Battle as BattleModel,
    BattleInvitation as BattleInvitationModel,
    TestCase as TestCaseModel,
    Submission as SubmissionModel,
    SubmissionTest as SubmissionTestModel,
    BattleEvaluation as BattleEvaluationModel,
    BattleResult as BattleResultModel,
} from '@prisma/client';
import { ProblemsService } from 'src/problems/problems.service';
import { exec } from 'child_process';
import { performance } from 'perf_hooks';

@Injectable()
export class BattleService {
    BATTLE_ROOM_CODE_LENGTH = 5;
    BATTLE_LOBBY_TIME_SEC = 30;
    BATTLE_DURATION_MIN = 10;
    PLAYER_BASE_RATING = 1000;
    ELO_K_FACTOR = 32;
    ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
    nanoid = customAlphabet(this.ALPHABET, this.BATTLE_ROOM_CODE_LENGTH);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly problemsService: ProblemsService,
    ) {}

    async getUserByAuth0Id(auth0Id: string): Promise<UserModel> {
        return this.prismaService.user.findUnique({
            where: {
                auth0Id,
            },
        });
    }

    async getUserById(id: string): Promise<UserModel> {
        return this.prismaService.user.findUnique({
            where: {
                id,
            },
        });
    }

    async createUser(auth0Id: string): Promise<UserModel> {
        return this.prismaService.user.create({
            data: {
                auth0Id: auth0Id,
                rating: 1000,
            },
        });
    }

    async getOrCreateUser(auth0Id: string): Promise<UserModel> {
        let user = await this.getUserByAuth0Id(auth0Id);

        if (!user) {
            user = await this.createUser(auth0Id);
        }

        return user;
    }

    async getBattleInvitation(
        inviteCode: string,
    ): Promise<BattleInvitationModel> {
        return await this.prismaService.battleInvitation.findUnique({
            where: {
                inviteCode,
            },
        });
    }

    async deleteAllPreviousBattleInvitation(userId: string) {
        await this.prismaService.battleInvitation.deleteMany({
            where: {
                user: {
                    id: userId,
                },
            },
        });
    }

    async getBattleRoomCode(): Promise<string> {
        const inviteCode: string = this.nanoid().toUpperCase();
        // check if the invite code exists
        const existingBattleInvitation =
            await this.prismaService.battleInvitation.findUnique({
                where: {
                    inviteCode,
                },
            });
        if (existingBattleInvitation) {
            return this.getBattleRoomCode();
        }
        return inviteCode;
    }

    async createBattleInvitation(
        userId: string,
    ): Promise<BattleInvitationModel> {
        await this.deleteAllPreviousBattleInvitation(userId);

        return this.prismaService.battleInvitation.create({
            data: {
                user: {
                    connect: { id: userId },
                },
                inviteCode: await this.getBattleRoomCode(),
            },
        });
    }

    async getBattleByInviteCode(inviteCode: string) {
        return await this.prismaService.battle.findUnique({
            where: {
                inviteCode,
            },
            include: {
                users: {
                    select: {
                        battleId: false,
                        userId: false,
                        user: {
                            select: {
                                id: true,
                                auth0Id: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async isBattleJoinable(
        battle: BattleModel & {
            users: {
                user: {
                    id: string;
                    auth0Id: string;
                };
            }[];
        },
        userId: string,
    ): Promise<Boolean> {
        let joinable = false;
        battle.users.forEach((user) => {
            if (user.user.id === userId) {
                joinable = true;
                return;
            }
        });
        return joinable;
    }

    async createBattle(
        userId: string,
        inviteCode: string,
    ): Promise<BattleModel> {
        const battleInvitation = await this.getBattleInvitation(inviteCode);
        let date = new Date();
        const startTime = new Date(
            date.setSeconds(date.getSeconds() + this.BATTLE_LOBBY_TIME_SEC),
        );
        const endTime = new Date(
            date.setMinutes(startTime.getMinutes() + this.BATTLE_DURATION_MIN),
        );
        return await this.prismaService.battle.create({
            data: {
                inviteCode,
                problem: {
                    connect: {
                        id: (await this.problemsService.getRandomProblem()).id,
                    },
                },
                startTime,
                endTime,
                users: {
                    create: [
                        {
                            user: {
                                connect: {
                                    id: battleInvitation.userId,
                                },
                            },
                        },
                        {
                            user: {
                                connect: {
                                    id: userId,
                                },
                            },
                        },
                    ],
                },
            },
        });
    }

    async getBattleById(battleId: string): Promise<BattleModel> {
        return await this.prismaService.battle.findUnique({
            where: {
                id: battleId,
            },
        });
    }

    async getProblemAndExampleById(problemId: string) {
        return await this.problemsService.getProblemAndExampleById(problemId);
    }

    async getUsersOnBattleById(battleId: string) {
        return await this.prismaService.usersOnBattles.findMany({
            where: {
                battleId,
            },
            select: {
                user: {
                    select: {
                        id: true,
                        auth0Id: true,
                    },
                },
            },
        });
    }

    async updateBattleTimestamps(battleId: string) {
        let date = new Date();
        const startTime = new Date(date.setSeconds(date.getSeconds()));
        const endTime = new Date(
            date.setMinutes(startTime.getMinutes() + this.BATTLE_DURATION_MIN),
        );
        await this.prismaService.battle.update({
            where: {
                id: battleId,
            },
            data: {
                startTime,
                endTime,
            },
        });
    }

    async isBattleStarted(battleId: string): Promise<Boolean> {
        const usersOnBattleWhoseReady =
            await this.prismaService.usersOnBattles.findMany({
                where: {
                    battleId,
                    readyToBattle: true,
                },
            });

        return usersOnBattleWhoseReady.length >= 2;
    }

    async readyBattle(battleId: string, userId: string): Promise<Boolean> {
        await this.prismaService.usersOnBattles.update({
            where: {
                battleId_userId: {
                    battleId,
                    userId,
                },
            },
            data: {
                readyToBattle: true,
            },
        });

        if (await this.isBattleStarted(battleId)) {
            await this.updateBattleTimestamps(battleId);
            return true;
        }
        return false;
    }

    async updateBattleFinished(battleId: string) {
        await this.prismaService.battle.update({
            where: {
                id: battleId,
            },
            data: {
                finished: true,
            },
        });
    }

    async deleteBattleInvitationByInviteCode(inviteCode) {
        await this.prismaService.battleInvitation.delete({
            where: {
                inviteCode,
            },
        });
    }

    async deleteBattleById(battleId: string): Promise<BattleModel> {
        return await this.prismaService.battle.delete({
            where: {
                id: battleId,
            },
        });
    }

    async runCode(code: string, input: string): Promise<string> {
        return new Promise(function (resolve, reject) {
            let inputArray = input.trim().split('\n');
            if (
                code.includes('input()') &&
                inputArray.length === 1 &&
                inputArray[0] === ''
            ) {
                reject(
                    'The number of input given is less than what the code requires',
                );
            }
            code = `import sys;inputs = sys.argv[1:]\n${code}`;
            for (let i = 0; i < inputArray.length; i++) {
                code = code.replace('input()', `inputs[${i}]`);
            }
            if (code.includes('input()')) {
                reject(
                    'The number of input given is less than what the code requires',
                );
            }
            const inputArgs = inputArray.join(' ');
            exec(`python -c '${code}' ${inputArgs}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async checkRunCodeOutput(
        problemId: string,
        input: string,
        output: string,
    ): Promise<string> {
        const examples = await this.problemsService.getExamplesById(problemId);

        let correct = false;
        let testedAtLeastOnce = false;

        examples.testCases.forEach((example) => {
            if (example.input === input) {
                testedAtLeastOnce = true;
                if (example.output === output) {
                    correct = true;
                    return;
                }
            }
        });

        return !testedAtLeastOnce || correct ? 'correct' : 'incorrect';
    }

    async getTestCasesById(problemId: string) {
        return await this.problemsService.getTestCasesById(problemId);
    }

    async createSubmission(
        userId: string,
        battleId: string,
        code: string,
    ): Promise<SubmissionModel> {
        return await this.prismaService.submission.create({
            data: {
                code,
                user: {
                    connect: {
                        id: userId,
                    },
                },
                battle: {
                    connect: {
                        id: battleId,
                    },
                },
            },
        });
    }

    async createSubmissionTest(
        submission: SubmissionModel,
        testCase: TestCaseModel,
    ): Promise<SubmissionTestModel> {
        let output: string;
        let outputType: string;
        let code_performance: number;

        try {
            const start = performance.now();
            output = await this.runCode(submission.code, testCase.input);
            const end = performance.now();
            code_performance = Math.round(end - start);
            outputType = testCase.output === output ? 'correct' : 'incorrect';
        } catch (err) {
            output = String(err);
            outputType = 'error';
        }

        return await this.prismaService.submissionTest.create({
            data: {
                order: testCase.order,
                output,
                outputType,
                performance: code_performance,
                submission: {
                    connect: {
                        id: submission.id,
                    },
                },
                testCase: {
                    connect: {
                        id: testCase.id,
                    },
                },
            },
        });
    }

    async addBattleEvaluationToResult(
        resultId: string,
        battleEvaluationId: string,
    ) {
        await this.prismaService.battleResult.update({
            where: {
                id: resultId,
            },
            data: {
                evaluations: {
                    connect: [
                        {
                            id: battleEvaluationId,
                        },
                    ],
                },
            },
        });
    }

    async submitCode(
        userId: string,
        battleId: string,
        resultId: string,
        problemId: string,
        code: string,
        testCases: TestCaseModel[],
    ) {
        const submission = await this.createSubmission(userId, battleId, code);

        const submissionTests = await Promise.all(
            testCases.map(async (testCase) => {
                return await this.createSubmissionTest(submission, testCase);
            }),
        );

        const battleEvaluation = await this.createBattleEvaluation(
            userId,
            resultId,
            submission,
            submissionTests,
        );

        await this.addBattleEvaluationToResult(resultId, battleEvaluation.id);

        const tests = await Promise.all(
            submissionTests.map(async (test) => {
                const testCase = await this.problemsService.getTestCaseById(
                    test.testCaseId,
                );
                return {
                    output: test.output,
                    outputType: test.outputType,
                    testCase: {
                        input: testCase.input,
                        output: testCase.output,
                    },
                };
            }),
        );

        const problem = await this.problemsService.getProblemReviewById(
            problemId,
        );

        return {
            code,
            tests,
            problem,
        };
    }

    async getSubmissionsByBattleId(
        battleId: string,
    ): Promise<SubmissionModel[]> {
        return await this.prismaService.submission.findMany({
            where: {
                battleId,
            },
        });
    }

    async createBattleResult(battleId: string): Promise<BattleResultModel> {
        return await this.prismaService.battleResult.create({
            data: {
                battleId,
                score: 0,
            },
        });
    }

    async createBattleEvaluation(
        userId: string,
        resultId: string,
        submission: SubmissionModel,
        submissionTests: SubmissionTestModel[],
    ): Promise<BattleEvaluationModel> {
        const correctTestCases = submissionTests.filter(
            (test) => test.outputType === 'correct',
        );
        const correctness = correctTestCases.length;

        if (correctness === 0) {
            return await this.prismaService.battleEvaluation.create({
                data: {
                    userId,
                    resultId,
                    correctness,
                    performance: 0,
                    time: 0,
                },
            });
        }

        const battleStartTime = (await this.getBattleById(submission.battleId))
            .startTime;

        const performance =
            Math.round(
                correctTestCases.reduce(
                    (sum: number, test) => sum + test.performance,
                    0,
                ) / correctness,
            ) || 0;
        const time =
            submission.submittedAt.getTime() - battleStartTime.getTime();

        return await this.prismaService.battleEvaluation.create({
            data: {
                userId,
                resultId,
                correctness,
                performance,
                time,
            },
        });
    }

    async getBattleResultByBattleId(
        battleId: string,
    ): Promise<BattleResultModel> {
        return await this.prismaService.battleResult.findUnique({
            where: {
                battleId,
            },
        });
    }

    async getBattleResultById(resultId: string) {
        return await this.prismaService.battleResult.findUnique({
            where: {
                id: resultId,
            },
            include: {
                evaluations: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async getBattleResultResponse(resultId: string) {
        return await this.prismaService.battleResult.findUnique({
            where: {
                id: resultId,
            },
            include: {
                evaluations: true,
            },
        });
    }

    async updateBattleResult(
        resultId: string,
        winnerId: string,
        isDraw: boolean,
        score: number,
    ): Promise<BattleResultModel> {
        return await this.prismaService.battleResult.update({
            where: {
                id: resultId,
            },
            data: {
                winnerId,
                isDraw,
                score,
            },
        });
    }

    async getWinner(
        result: BattleResultModel & {
            evaluations: (BattleEvaluationModel & {
                user: UserModel;
            })[];
        },
    ): Promise<string> {
        const [user1Evaluation, user2Evaluation] = result.evaluations;

        if (user1Evaluation.correctness > user2Evaluation.correctness) {
            return user1Evaluation.userId;
        } else if (user2Evaluation.correctness > user1Evaluation.correctness) {
            return user2Evaluation.userId;
        } else {
            if (user1Evaluation.performance < user2Evaluation.performance) {
                return user1Evaluation.userId;
            } else if (
                user2Evaluation.performance < user1Evaluation.performance
            ) {
                return user2Evaluation.userId;
            } else {
                if (user1Evaluation.time < user2Evaluation.time) {
                    return user1Evaluation.userId;
                } else if (user2Evaluation.time < user1Evaluation.time) {
                    return user2Evaluation.userId;
                } else {
                    return 'draw';
                }
            }
        }
    }

    async calculateElo(
        result: BattleResultModel & {
            evaluations: (BattleEvaluationModel & {
                user: UserModel;
            })[];
        },
        winnerId: string,
    ) {
        const [player1, player2] = result.evaluations;

        if (player1.correctness === 0 && player2.correctness === 0) {
            return {
                elo: 0,
                player1Rating: player1.user.rating,
                player2Rating: player2.user.rating,
            };
        }

        const player1Prob =
            1 / (1 + 10 ** ((player2.user.rating - player1.user.rating) / 400));
        const player2Prob = 1 - player1Prob;

        let scoreA = 0.5;
        if (winnerId === player1.userId) {
            scoreA = 1.0;
        } else if (winnerId === player2.userId) {
            scoreA = 0.0;
        }

        const scoreB = 1 - scoreA;

        const player1Rating = Math.round(
            player1.user.rating + this.ELO_K_FACTOR * (scoreA - player1Prob),
        );
        const player2Rating = Math.round(
            player2.user.rating + this.ELO_K_FACTOR * (scoreB - player2Prob),
        );

        const elo = Math.abs(player1Rating - player1.user.rating);

        return {
            elo,
            player1Rating,
            player2Rating,
        };
    }

    async updateUserRating(userId: string, newRating: number) {
        await this.prismaService.user.update({
            where: {
                id: userId,
            },
            data: {
                rating: newRating,
            },
        });
    }

    async checkBattleWinner(resultId: string) {
        const result = await this.getBattleResultById(resultId);

        const [player1, player2] = result.evaluations;

        let winnerId = await this.getWinner(result);

        let isDraw = false;

        const elo = await this.calculateElo(result, winnerId);

        const {
            elo: score,
            player1Rating: player1NewRating,
            player2Rating: player2NewRating,
        } = elo;

        if (winnerId === 'draw') {
            isDraw = true;
            if (player1.user.rating >= player1NewRating) {
                winnerId = player1.userId;
            } else {
                winnerId = player2.userId;
            }
        }

        await this.updateUserRating(player1.userId, player1NewRating);
        await this.updateUserRating(player2.userId, player2NewRating);

        await this.updateBattleResult(resultId, winnerId, isDraw, score);

        return await this.getBattleResultResponse(resultId);
    }
}
