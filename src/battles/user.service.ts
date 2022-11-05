import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User as UserModel } from '@prisma/client';

@Injectable()
export class UserService {
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
