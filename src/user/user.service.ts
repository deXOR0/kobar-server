import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User as UserModel } from '@prisma/client';
import jwt_decode, { JwtPayload } from 'jwt-decode';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom, lastValueFrom, map } from 'rxjs';

@Injectable()
export class UserService {
    PLAYER_BASE_RATING = Number(process.env.PLAYER_BASE_RATING);
    AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
    AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
    AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
    AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly httpService: HttpService,
    ) {}

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

    async deleteUser(payload: any): Promise<UserModel> {
        const { sub: auth0Id } = payload;

        const httpService = this.httpService;

        const requestConfig: AxiosRequestConfig = {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        };
        const { access_token } = await firstValueFrom(
            httpService
                .post(
                    `https://${this.AUTH0_DOMAIN}/oauth/token`,
                    {
                        grant_type: 'client_credentials',
                        client_id: this.AUTH0_CLIENT_ID,
                        client_secret: this.AUTH0_CLIENT_SECRET,
                        audience: `https://${this.AUTH0_DOMAIN}/api/v2/`,
                    },
                    requestConfig,
                )
                .pipe(
                    map((res: any) => res.data),
                    catchError((e) => {
                        throw new HttpException(
                            e.response.data,
                            e.response.status,
                        );
                    }),
                ),
        );

        const deleteRequestConfig: AxiosRequestConfig = {
            headers: { Authorization: `Bearer ${access_token}` },
        };

        console.log(
            await firstValueFrom(
                httpService
                    .delete(
                        `https://${this.AUTH0_DOMAIN}/api/v2/users/${auth0Id}`,
                        deleteRequestConfig,
                    )
                    .pipe(
                        map((res: any) => res.data),
                        catchError((e) => {
                            throw new HttpException(
                                e.response.data,
                                e.response.status,
                            );
                        }),
                    ),
            ),
        );

        return this.prismaService.user.delete({
            where: {
                auth0Id,
            },
        });
    }
}
