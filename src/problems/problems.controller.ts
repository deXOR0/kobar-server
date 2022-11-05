import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateProblemsDto } from './dto';
import { ProblemsGuard } from './problems.guard';
import { ProblemsService } from './problems.service';

@Controller('problems')
@UseGuards(ProblemsGuard)
export class ProblemsController {
    constructor(private readonly problemsService: ProblemsService) {}

    @Post()
    async create(@Body() data: CreateProblemsDto) {
        return await this.problemsService.createProblems(data);
    }
}
