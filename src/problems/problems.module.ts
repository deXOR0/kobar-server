import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProblemsController } from './problems.controller';
import { ProblemsGuard } from './problems.guard';
import { ProblemsService } from './problems.service';

@Module({
    controllers: [ProblemsController],
    providers: [ProblemsService, PrismaService, ProblemsGuard],
    exports: [ProblemsService],
})
export class ProblemsModule {}
