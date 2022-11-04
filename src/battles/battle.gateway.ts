import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BattleService } from './battle.service';
import {
    JoinBattleDto,
    ExchangeIdDto,
    CreateBattleInvitationDto,
    ReadyBattleDto,
    CancelBattleDto,
    RunCodeDto,
    SubmitCodeDto,
} from './dto';
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
        await this.withAuthorization(client);
        if (!client.auth) {
            console.error('Cannot verify access token');
            client.disconnect();
        }
    }

    @SubscribeMessage('exchangeId')
    async handleExchangeId(
        client: Socket,
        data: ExchangeIdDto,
    ): Promise<WsResponse<unknown>> {
        const user = await this.battleService.getOrCreateUser(data.auth0Id);

        return { event: 'idExchanged', data: { userId: user.id } };
    }

    @SubscribeMessage('createBattleInvitation')
    async handleCreateBattleInvitation(
        client: Socket,
        data: CreateBattleInvitationDto,
    ): Promise<WsResponse<unknown>> {
        const battleInvitation =
            await this.battleService.createBattleInvitation(data.userId);
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

        // Battle has not been started yet, create a new battle
        if (!battle) {
            client.join(inviteCode);
            const newBattle = await this.battleService.createBattle(
                userId,
                inviteCode,
            );
            const users = await this.battleService.getUsersOnBattleById(
                newBattle.id,
            );
            const response: any = newBattle;
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
            const response: any = battle;
            if (await this.battleService.isBattleStarted(battle.id)) {
                const problem =
                    await this.battleService.getProblemAndExampleById(
                        battle.problemId,
                    );
                response.problem = problem;
            }
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

    @SubscribeMessage('readyBattle')
    async handleReadyBattle(client: Socket, data: ReadyBattleDto) {
        const { userId, battleId } = data;
        const battleStarting = await this.battleService.readyBattle(
            battleId,
            userId,
        );

        if (battleStarting) {
            const battle = await this.battleService.getBattleById(battleId);
            const response: any = battle;
            const problem = await this.battleService.getProblemAndExampleById(
                battle.problemId,
            );
            response.problem = problem;

            this.server
                .to(battle.inviteCode)
                .emit('battleStarted', { battle: response });
        } else {
            return { event: 'waitingForOpponent' };
        }
    }

    @SubscribeMessage('cancelBattle')
    async handleCancelBattle(client: Socket, data: CancelBattleDto) {
        const { battleId } = data;
        const battle = await this.battleService.deleteBattleById(battleId);
        await this.battleService.deleteBattleInvitationByInviteCode(
            battle.inviteCode,
        );

        this.server.to(battle.inviteCode).emit('battleCancelled', { battleId });
    }

    @SubscribeMessage('runCode')
    async handleRunCode(
        client: Socket,
        data: RunCodeDto,
    ): Promise<WsResponse<unknown>> {
        const { battleId, code, input } = data;

        const battle = await this.battleService.getBattleById(battleId);

        try {
            client.to(battle.inviteCode).emit('opponentRunCode');
            const output = await this.battleService.runCode(code, input);
            const outputType = await this.battleService.checkRunCodeOutput(
                battle.problemId,
                input,
                output,
            );
            return { event: 'codeRan', data: { type: outputType, output } };
        } catch (err) {
            return {
                event: 'codeRan',
                data: { type: 'error', output: String(err) },
            };
        }
    }

    @SubscribeMessage('submitCode')
    async handleSubmitCode(client: Socket, data: SubmitCodeDto) {
        const { userId, battleId, problemId, code } = data;

        const battle = await this.battleService.getBattleById(battleId);

        const testCases = await this.battleService.getTestCasesById(
            battle.problemId,
        );

        let battleResult = await this.battleService.getBattleResultByBattleId(
            battleId,
        );

        const battleDone = !!battleResult;

        if (!battleResult) {
            battleResult = await this.battleService.createBattleResult(
                battleId,
            );
        }

        const response = await this.battleService.submitCode(
            userId,
            battleId,
            battleResult.id,
            problemId,
            code,
            testCases,
        );

        if (battleDone) {
            const finalBattleResult =
                await this.battleService.checkBattleWinner(battleResult.id);
            this.server
                .to(battle.inviteCode)
                .emit('battleFinished', { battleResult: finalBattleResult });
        } else {
            client.to(battle.inviteCode).emit('opponentSubmittedCode');
        }
        return { event: 'codeSubmitted', data: response };
    }
}
