/**
 * Interface for bucket-based flow control
 */
export interface IBucket {
    acquire(): Promise<void>
}

export type TokenBucketParams = {
    readonly capacity: number
    readonly refillRate: number
    readonly refillInterval: number
    readonly initialTokens?: number
}

/**
 * Token Bucket algorithm implementation.
 * Tokens are refilled at a constant rate up to capacity.
 * Allows bursts when tokens are available.
 */
export class TokenBucket implements IBucket {
    private readonly capacity: number
    private readonly refillRate: number
    private readonly refillInterval: number
    private tokens: number
    private lastRefillTime: number
    private waitQueue: Array<() => void> = []
    private scheduledTimer: ReturnType<typeof setTimeout> | null = null

    constructor(params: TokenBucketParams) {
        this.capacity = params.capacity
        this.refillRate = params.refillRate
        this.refillInterval = params.refillInterval
        this.tokens = params.initialTokens ?? 0
        this.lastRefillTime = Date.now()
    }

    private refill(): void {
        const now = Date.now()
        const elapsed = now - this.lastRefillTime
        const intervalsElapsed = Math.floor(elapsed / this.refillInterval)
        if (intervalsElapsed > 0) {
            const tokensToAdd = intervalsElapsed * this.refillRate
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
            this.lastRefillTime += intervalsElapsed * this.refillInterval
        }
    }

    private processQueue(): void {
        this.scheduledTimer = null
        this.refill()
        while (this.waitQueue.length > 0 && this.tokens > 0) {
            this.tokens--
            const resolve = this.waitQueue.shift()!
            resolve()
        }
        this.scheduleNextRefill()
    }

    private scheduleNextRefill(): void {
        if (this.waitQueue.length === 0 || this.scheduledTimer !== null) {
            return
        }
        const now = Date.now()
        const timeUntilNextRefill = this.refillInterval - (now - this.lastRefillTime)
        const delay = Math.max(0, timeUntilNextRefill)
        this.scheduledTimer = setTimeout(() => this.processQueue(), delay)
    }

    async acquire(): Promise<void> {
        this.refill()
        if (this.tokens > 0) {
            this.tokens--
            return
        }
        return new Promise<void>((resolve) => {
            this.waitQueue.push(resolve)
            this.scheduleNextRefill()
        })
    }
}

export type LeakyBucketParams = {
    readonly leakRate: number
    readonly leakInterval: number
}

/**
 * Leaky Bucket algorithm implementation.
 * Tasks are released at a constant rate, smoothing out bursts.
 * Unlike Token Bucket, this enforces a steady output rate.
 */
export class LeakyBucket implements IBucket {
    private readonly intervalPerTask: number
    private nextAvailableTime: number
    private waitQueue: Array<() => void> = []
    private scheduledTimer: ReturnType<typeof setTimeout> | null = null

    constructor(params: LeakyBucketParams) {
        this.intervalPerTask = params.leakInterval / params.leakRate
        this.nextAvailableTime = Date.now()
    }

    private processQueue(): void {
        this.scheduledTimer = null
        const now = Date.now()
        while (this.waitQueue.length > 0 && this.nextAvailableTime <= now) {
            this.nextAvailableTime += this.intervalPerTask
            const resolve = this.waitQueue.shift()!
            resolve()
        }
        this.scheduleNextLeak()
    }

    private scheduleNextLeak(): void {
        if (this.waitQueue.length === 0 || this.scheduledTimer !== null) {
            return
        }
        const now = Date.now()
        const delay = Math.max(0, this.nextAvailableTime - now)
        this.scheduledTimer = setTimeout(() => this.processQueue(), delay)
    }

    async acquire(): Promise<void> {
        const now = Date.now()
        if (this.nextAvailableTime <= now) {
            this.nextAvailableTime = now + this.intervalPerTask
            return
        }
        return new Promise<void>((resolve) => {
            this.waitQueue.push(resolve)
            this.scheduleNextLeak()
        })
    }
}