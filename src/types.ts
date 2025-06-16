export interface ISemaphore {

    synchronized<T>(cb: () => Promise<T>): Promise<T>

    waitComplete(): Promise<void>

    waitCompleteAll(): Promise<void>

    get numberOfRunningTasks(): number

    get numberOfTasks(): number
}


export type SynchronizerStats = {
    maxConcurrentExecution: number
    numberOfTasks: number,
    numberOfRunningTasks: number,
}

export type SynchronizerContext = {
    providerId: string,
    synchronizerId: string,
    executionId: string,
}

export type SynchronizerCallback<T> = (context: SynchronizerContext) => Promise<T>

export type SynchronizerEventType =
    "Acquire"
    | "Acquired"
    | "Cancel"
    | "Enter"
    | "Exit"
    | "Release"
    | "Finish"
    | "Timeout"
    | "Throttle"

export type SynchronizerEvent = {
    readonly type: SynchronizerEventType
    readonly stats: Readonly<SynchronizerStats>
    readonly context: Readonly<SynchronizerContext>
}

export type SynchronizerEventListener = (event: SynchronizerEvent) => void

export type SynchronizerProviderParams = {
    readonly providerId?: string,
    readonly onEvent?: SynchronizerEventListener,
}


export type  CachedProviderParams<T> = {
    readonly factory: () => Promise<T>
    readonly cacheTimestamp?: (obj: T) => Date
    readonly defaultTTL?: number
}

export type SynchronizerParams = SynchronizerProviderParams
    & Partial<Pick<SynchronizerStats, "maxConcurrentExecution">> & {
    readonly synchronizerId?: string,
    readonly raiseOnReentrant?: boolean
}

export type SynchronizerTask<T> = {
    task: T
}

export type SynchronizerTaskExecutorParams<T> = {
    readonly maxTasksInFlight: number
    readonly maxTasksInExecution?: number
    readonly taskSource: AsyncGenerator<SynchronizerTask<T>>
    readonly taskExecutor: (params: SynchronizerTask<T>) => Promise<void>
    readonly onTaskError?: (e: unknown) => void
}