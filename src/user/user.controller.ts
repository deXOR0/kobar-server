import {
    Controller,
    Delete,
    HttpCode,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import auth0Middleware from '../battles/authentication-gateway.middleware';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
    AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

    withAuthorization = auth0Middleware(this.AUTH0_DOMAIN, this.AUTH0_AUDIENCE);

    constructor(private readonly userService: UserService) {}

    @Delete()
    @HttpCode(200)
    async deleteUser(@Headers() headers) {
        const { Authorization: token } = headers;

        const client = {
            handshake: {
                auth: {
                    token,
                },
            },
            auth: null,
        };

        await this.withAuthorization(client);

        if (!client.auth) {
            console.error('Cannot verify access token');
            throw new UnauthorizedException();
        }

        return await this.userService.deleteUser(client.auth.user);
    }
}
