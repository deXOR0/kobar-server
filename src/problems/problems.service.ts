import { Injectable } from '@nestjs/common';
import { Problem as ProblemModel } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateProblemsDto } from './dto';

@Injectable()
export class ProblemsService {
    constructor(private readonly prismaService: PrismaService) {}

    async createProblems(data: CreateProblemsDto): Promise<ProblemModel> {
        const {
            prompt,
            inputFormat,
            outputFormat,
            exampleCount,
            testCases,
            reviewVideoURL,
            reviewText,
        } = data;
        return await this.prismaService.problem.create({
            data: {
                prompt,
                inputFormat,
                outputFormat,
                exampleCount,
                reviewVideoURL,
                reviewText,
                testCases: {
                    create: testCases,
                },
            },
        });
    }

    async getRandomProblem(): Promise<ProblemModel> {
        const problemsCount = await this.prismaService.problem.count();
        const skip = Math.floor(Math.random() * problemsCount);
        const problem = await this.prismaService.problem.findMany({
            take: 1,
            skip,
        });
        return problem[0];
    }

    async getProblemById(problemId: string): Promise<ProblemModel> {
        return await this.prismaService.problem.findUnique({
            where: {
                id: problemId,
            },
        });
    }

    async getProblemAndExampleById(problemId: string) {
        const exampleCount = (await this.getProblemById(problemId))
            .exampleCount;
        return await this.prismaService.problem.findUnique({
            where: {
                id: problemId,
            },
            include: {
                testCases: {
                    take: exampleCount,
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });
    }

    async getExamplesById(problemId: string) {
        const exampleCount = (await this.getProblemById(problemId))
            .exampleCount;
        return await this.prismaService.problem.findUnique({
            where: {
                id: problemId,
            },
            select: {
                testCases: {
                    take: exampleCount,
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });
    }
}
