import {SynchronizerContext} from "./types";

export class SynchronizerError extends Error {
    constructor(readonly params: {
        readonly message?: string
        readonly code: string,
        readonly context?: Readonly<SynchronizerContext>
    }) {
        super(params.message ?? errorMessage(params.code, params.context));
    }

    get code() {
        return this.params.code
    }

    get context() {
        return this.params.context
    }
}

export class SynchronizerTimeoutError extends SynchronizerError {
    constructor(context?: Readonly<SynchronizerContext>) {
        super({
            code: "Timeout",
            context
        })
    }
}

export class SynchronizerThrottleError extends SynchronizerError {
    constructor(context?: Readonly<SynchronizerContext>) {
        super({
            code: "Throttle",
            context
        })
    }
}

export class SynchronizerInvalidError extends SynchronizerError {
    constructor(message: string, context?: Readonly<SynchronizerContext>) {
        super({
            message,
            code: "Invalid",
            context
        });
    }
}

export class SynchronizerReentrantExecutionError extends SynchronizerError {
    constructor(context?: Readonly<SynchronizerContext>) {
        super({
            code: "ReentrantExecution",
            context
        });
    }
}

function errorMessage(code: string, context?: Readonly<SynchronizerContext>): string {
    if (context === undefined) {
        return `Synchronizer${code}Error`
    }
    return `Synchronizer${code}Error in ${context.providerId}/${context.providerId}/${context.executionId}`
}