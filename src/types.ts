export type SynchronizerStats = {
    maxConcurrentExecution: number
    numberOfTasks: number,
    numberOfRunningTasks: number,
}

export type SynchronizerContext = {
    providerId?: string,
    synchronizerId?: string,
    executionId?: string,
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

export type SynchronizerProviderParams = Pick<SynchronizerContext, "providerId"> & {
    readonly onEvent?: SynchronizerEventListener,
}


export type  CachedProviderParams<T> = {
    readonly factory: () => Promise<T>
    readonly cacheTimestamp?: (obj: T) => Date
    readonly defaultTTL?: number
}
