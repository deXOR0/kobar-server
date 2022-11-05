import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BattleInvitation as BattleInvitationModel } from '@prisma/client';
import { customAlphabet } from 'nanoid';

@Injectable()
export class BattleInvitationService {
    BATTLE_ROOM_CODE_LENGTH = Number(process.env.BATTLE_ROOM_CODE_LENGTH);
    ALPHABET = process.env.BATTLE_ROOM_CODE_ALPHABET;
    nanoid = customAlphabet(this.ALPHABET, this.BATTLE_ROOM_CODE_LENGTH);

    constructor(private readonly prismaService: PrismaService) {}

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

    async deleteBattleInvitationByInviteCode(inviteCode) {
        await this.prismaService.battleInvitation.delete({
            where: {
                inviteCode,
            },
        });
    }
}
