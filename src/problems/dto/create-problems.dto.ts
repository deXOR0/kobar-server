import { CreateTestCasesDto } from './create-test-cases.dto';

export class CreateProblemsDto {
    readonly secretKey: string;
    readonly prompt: string;
    readonly inputFormat: string;
    readonly outputFormat: string;
    readonly exampleCount: number;
    readonly reviewVideoURL: string;
    readonly reviewText: string;
    readonly testCases: CreateTestCasesDto[];
}
