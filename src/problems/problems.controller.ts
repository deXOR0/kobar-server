import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProblemsDto } from './dto';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
    constructor(private readonly problemsService: ProblemsService) {}

    @Post()
    async create(@Body() data: CreateProblemsDto) {
        return await this.problemsService.createProblems(data);
    }
}
