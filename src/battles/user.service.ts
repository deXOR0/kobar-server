import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User as UserModel } from '@prisma/client';
import jwt_decode, { JwtPayload } from 'jwt-decode';

@Injectable()
export class UserService {
    PLAYER_BASE_RATING = Number(process.env.PLAYER_BASE_RATING);

    constructor(private readonly prismaService: PrismaService) {}

    async getUserById(id: string): Promise<UserModel> {
        return this.prismaService.user.findUnique({
            where: {
                id,
            },
        });
    }

    async getUserByAuth0Id(auth0Id: string): Promise<UserModel> {
        return this.prismaService.user.findUnique({
            where: {
                auth0Id,
            },
        });
    }

    async createUser(payload: any): Promise<UserModel> {
        const { nickname, picture, sub } = payload;

        return this.prismaService.user.create({
            data: {
                auth0Id: sub,
                nickname,
                picture,
                rating: this.PLAYER_BASE_RATING,
            },
        });
    }

    async getOrCreateUser(idToken: string): Promise<UserModel> {
        const data: any = jwt_decode(idToken);

        let user = await this.getUserByAuth0Id(data.sub);

        if (!user) {
            user = await this.createUser(data);
        }

        return user;
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
}
