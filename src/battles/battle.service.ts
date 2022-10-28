import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from 'src/prisma.service';
import {
    User as UserModel,
    Battle as BattleModel,
    BattleInvitation as BattleInvitationModel,
    UsersOnBattles as UsersOnBattlesModel,
} from '@prisma/client';
import { ProblemsService } from 'src/problems/problems.service';

@Injectable()
export class BattleService {
    BATTLE_ROOM_CODE_LENGTH = 5;
    BATTLE_LOBBY_TIME_SEC = 30;
    BATTLE_DURATION_MIN = 10;
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
}
