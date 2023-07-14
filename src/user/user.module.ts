import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    controllers: [UserController],
    providers: [UserService, PrismaService],
    imports: [HttpModule],
})
export class UserModule {}
