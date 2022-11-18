import { Injectable } from '@nestjs/common';
import { ProblemsService } from '../problems/problems.service';
import { SubmissionTest as SubmissionTestModel } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
import { RunCodeResponseDto } from './dto';

@Injectable()
export class CodeService {
    constructor(
        private readonly problemsService: ProblemsService,
        private readonly httpService: HttpService,
    ) {}

    GAUL_LANG_SERVICE = process.env.GAUL_LANG_SERVICE;

    async runCode(code: string, input: string): Promise<RunCodeResponseDto> {
        const httpService = this.httpService;
        const GAUL_LANG_SERVICE = this.GAUL_LANG_SERVICE;
        return new Promise(async function (resolve, reject) {
            let inputArray = [];
            if (input.trim() !== '') {
                inputArray = input
                    .trim()
                    .split('\n')
                    .map((el) => {
                        const val = Number(el);

                        if (isNaN(val)) {
                            return el;
                        }

                        return val;
                    });
            }
            const { type, performance, output } = await firstValueFrom(
                httpService
                    .post(`${GAUL_LANG_SERVICE}/run`, {
                        code,
                        input: inputArray,
                    })
                    .pipe(map((res: any) => res.data)),
            );

            if (type === 'success') {
                resolve({ output, performance });
            } else {
                reject(String(output));
            }
        });
    }

    async checkRunCodeOutput(
        problemId: string,
        input: string,
        output: string,
    ): Promise<string> {
        const examples = await this.problemsService.getExamplesById(problemId);

        let correct = false;
        let testedAtLeastOnce = false;

        examples.testCases.forEach((example) => {
            if (example.input === input) {
                testedAtLeastOnce = true;
                if (example.output === output) {
                    correct = true;
                    return;
                }
            }
        });

        return !testedAtLeastOnce || correct ? 'correct' : 'incorrect';
    }

    async submitCode(
        problemId: string,
        code: string,
        submissionTests: SubmissionTestModel[],
    ) {
        const tests = await Promise.all(
            submissionTests.map(async (test) => {
                const testCase = await this.problemsService.getTestCaseById(
                    test.testCaseId,
                );
                return {
                    output: test.output,
                    outputType: test.outputType,
                    testCase: {
                        input: testCase.input,
                        output: testCase.output,
                    },
                };
            }),
        );

        const problem = await this.problemsService.getProblemReviewById(
            problemId,
        );

        return {
            code,
            tests,
            problem,
        };
    }
}
