import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BattlesModule } from './battles/battles.module';
import { ProblemsModule } from './problems/problems.module';

@Module({
    imports: [BattlesModule, ProblemsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
