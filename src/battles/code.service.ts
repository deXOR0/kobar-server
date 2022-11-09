import { Injectable } from '@nestjs/common';
import { ProblemsService } from 'src/problems/problems.service';
import { SubmissionTest as SubmissionTestModel } from '@prisma/client';
import Lexer from 'src/gaul-lang/lexer';
import Parser from 'src/gaul-lang/parser';

@Injectable()
export class CodeService {
    constructor(private readonly problemsService: ProblemsService) {}

    async runCode(code: string, input: string): Promise<string> {
        return new Promise(function (resolve, reject) {
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
            try {
                const tokens = new Lexer(code);
                const parser = new Parser(tokens);

                const ast = parser.parse();

                ast.eval(inputArray);

                resolve(ast.env.outputStream.join('\n'));
            } catch (err) {
                reject(String(err));
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
