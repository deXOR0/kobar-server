import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
    controllers: [ProblemsController],
    providers: [ProblemsService, PrismaService],
    exports: [ProblemsService],
})
export class ProblemsModule {}
