import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BattlesModule } from './battles/battles.module';
import { ProblemsModule } from './problems/problems.module';
import { UserModule } from './user/user.module';

@Module({
    imports: [BattlesModule, ProblemsModule, UserModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
