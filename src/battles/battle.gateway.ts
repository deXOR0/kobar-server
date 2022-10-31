import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BattleService } from './battle.service';
import { JoinBattleDto, ExchangeIdDto, CreateBattleInvitationDto } from './dto';
import auth0Middleware from './authentication-gateway.middleware';

@WebSocketGateway({ namespace: 'battle', cors: true })
export class BattleGateway {
    withAuthorization = auth0Middleware(
        'awesa.au.auth0.com',
        'http://localhost:3000/invite',
    );

    @WebSocketServer()
    server;

    constructor(private readonly battleService: BattleService) {}

    async handleConnection(client: Socket) {
        console.log(`A client is connected ${client.id}`);
        await this.withAuthorization(client);
        if (!client.auth) {
            console.log('Cannot verify access token');
            client.disconnect();
        }
    }

    @SubscribeMessage('exchangeId')
    async handleExchangeId(
        client: Socket,
        data: ExchangeIdDto,
    ): Promise<WsResponse<unknown>> {
        const user = await this.battleService.getOrCreateUser(data.auth0Id);
        console.log(user.id);

        return { event: 'idExchanged', data: { userId: user.id } };
    }

    @SubscribeMessage('createBattleInvitation')
    async handleCreateBattleInvitation(
        client: Socket,
        data: CreateBattleInvitationDto,
    ): Promise<WsResponse<unknown>> {
        const battleInvitation =
            await this.battleService.createBattleInvitation(data.userId);
        console.log(battleInvitation);
        client.join(battleInvitation.inviteCode);
        return { event: 'battleInvitationCreated', data: battleInvitation };
    }

    @SubscribeMessage('joinBattle')
    async handleJoinBattle(
        client: Socket,
        data: JoinBattleDto,
    ): Promise<WsResponse<unknown>> {
        const { userId, inviteCode } = data;

        const battle = await this.battleService.getBattleByInviteCode(
            inviteCode,
        );

        console.log(battle);

        // Battle has not been started yet, create a new battle
        if (!battle) {
            client.join(inviteCode);
            const newBattle = await this.battleService.createBattle(
                userId,
                inviteCode,
            );
            const problemAndExample =
                await this.battleService.getProblemAndExampleById(
                    newBattle.problemId,
                );
            const users = await this.battleService.getUsersOnBattleById(
                newBattle.id,
            );
            const response: any = newBattle;
            console.log(response);
            response.problem = problemAndExample;
            response.users = users;
            client.to(inviteCode).emit('opponentFound', {
                battle: response,
            });
            return {
                event: 'battleJoined',
                data: { battle: response },
            };
        }

        // Battle is already started, rejoin the battle if the user was part of the battle
        if (await this.battleService.isBattleJoinable(battle, userId)) {
            client.join(inviteCode);
            const problem = await this.battleService.getProblemAndExampleById(
                battle.problemId,
            );
            const response: any = battle;
            response.problem = problem;
            client.to(inviteCode).emit('opponentRejoined');
            return {
                event: 'battleRejoined',
                data: {
                    battle: response,
                },
            };
        }

        // User is not allowed to join the battle
        return {
            event: 'battleNotJoinable',
            data: {
                message: 'Max number of opponent has been reached',
            },
        };
    }
}
