import { Module } from '@nestjs/common';
import { BattleGateway } from './battle.gateway';
import { BattleService } from './battle.service';
import { PrismaService } from 'src/prisma.service';
import { ProblemsModule } from 'src/problems/problems.module';

@Module({
    providers: [BattleService, BattleGateway, PrismaService],
    imports: [ProblemsModule],
})
export class BattlesModule {}
