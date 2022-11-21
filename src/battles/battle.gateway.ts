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
import { UserService } from './user.service';
import { BattleInvitationService } from './battle-invitation.service';
import { CodeService } from './code.service';

@WebSocketGateway({ namespace: 'battle', cors: true })
export class BattleGateway {
    AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
    AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

    withAuthorization = auth0Middleware(this.AUTH0_DOMAIN, this.AUTH0_AUDIENCE);

    @WebSocketServer()
    server;

    constructor(
        private readonly battleService: BattleService,
        private readonly userService: UserService,
        private readonly battleInvitationService: BattleInvitationService,
        private readonly codeService: CodeService,
    ) {}

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
        const user = await this.userService.getOrCreateUser(data.auth0Id);

        return {
            event: 'idExchanged',
            data: {
                id: user.id,
                nickname: user.nickname,
                picture: user.picture,
                rating: user.rating,
            },
        };
    }

    @SubscribeMessage('createBattleInvitation')
    async handleCreateBattleInvitation(
        client: Socket,
        data: CreateBattleInvitationDto,
    ): Promise<WsResponse<unknown>> {
        const battleInvitation =
            await this.battleInvitationService.createBattleInvitation(
                data.userId,
            );
        client.join(battleInvitation.inviteCode);
        return { event: 'battleInvitationCreated', data: battleInvitation };
    }

    @SubscribeMessage('joinBattle')
    async handleJoinBattle(
        client: Socket,
        data: JoinBattleDto,
    ): Promise<WsResponse<unknown>> {
        const { userId, inviteCode } = data;

        const inviteCodeValid =
            await this.battleInvitationService.getBattleInvitation(inviteCode);

        if (!inviteCodeValid) {
            return {
                event: 'battleNotJoinable',
                data: {
                    message: 'Invalid invite code',
                },
            };
        }

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

        if (battle.finished) {
            return {
                event: 'battleNotJoinable',
                data: {
                    message: 'Battle has finished',
                },
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
            const users = await this.battleService.getUsersOnBattleById(
                battleId,
            );
            response.problem = problem;
            response.users = users;

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
        await this.battleInvitationService.deleteBattleInvitationByInviteCode(
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
            const response = await this.codeService.runCode(code, input);
            const { output } = response;
            const outputType = await this.codeService.checkRunCodeOutput(
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

        const existingSubmissionByUser =
            await this.battleService.getUserSubmissionForBattle(
                battleId,
                userId,
            );

        if (existingSubmissionByUser) {
            return {
                event: 'submissionError',
                data: { message: 'Can only submit once' },
            };
        }

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
            await this.battleInvitationService.deleteBattleInvitationByInviteCode(
                battle.inviteCode,
            );
            await this.battleService.updateBattleFinished(battleId);
            this.server
                .to(battle.inviteCode)
                .emit('battleFinished', { battleResult: finalBattleResult });
        } else {
            client.to(battle.inviteCode).emit('opponentSubmittedCode');
        }
        return { event: 'codeSubmitted', data: response };
    }
}
