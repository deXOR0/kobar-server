import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { ProblemsService } from 'src/problems/problems.service';
import {
    TestCase as TestCaseModel,
    Submission as SubmissionModel,
    SubmissionTest as SubmissionTestModel,
} from '@prisma/client';

@Injectable()
export class CodeService {
    constructor(private readonly problemsService: ProblemsService) {}

    async runCode(code: string, input: string): Promise<string> {
        return new Promise(function (resolve, reject) {
            let inputArray = input.trim().split('\n');
            if (
                code.includes('input()') &&
                inputArray.length === 1 &&
                inputArray[0] === ''
            ) {
                reject(
                    'The number of input given is less than what the code requires',
                );
            }
            code = `import sys;inputs = sys.argv[1:]\n${code}`;
            for (let i = 0; i < inputArray.length; i++) {
                code = code.replace('input()', `inputs[${i}]`);
            }
            if (code.includes('input()')) {
                reject(
                    'The number of input given is less than what the code requires',
                );
            }
            const inputArgs = inputArray.join(' ');
            exec(`python -c '${code}' ${inputArgs}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
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
