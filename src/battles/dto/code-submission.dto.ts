export class SubmitCodeDto {
    readonly userId: string;
    readonly battleId: string;
    readonly code: string;
}

export class RunCodeDto {
    readonly battleId: string;
    readonly code: string;
    readonly input: string;
}
