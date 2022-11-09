import { Module } from '@nestjs/common';
import { BattleGateway } from './battle.gateway';
import { BattleService } from './battle.service';
import { PrismaService } from '../prisma.service';
import { ProblemsModule } from '../problems/problems.module';
import { UserService } from './user.service';
import { CodeService } from './code.service';
import { BattleInvitationService } from './battle-invitation.service';

@Module({
    providers: [
        BattleService,
        BattleGateway,
        PrismaService,
        UserService,
        CodeService,
        BattleInvitationService,
    ],
    imports: [ProblemsModule],
})
export class BattlesModule {}
