import {TokenBucket, LeakyBucket} from "../src/Bucket"
import {sleep} from "./utils"

describe("TokenBucket", () => {
    test.concurrent("initial tokens = 0, acquire blocks until refill", async () => {
        const bucket = new TokenBucket({
            capacity: 10,
            refillRate: 1,
            refillInterval: 100,
            initialTokens: 0
        })

        const start = Date.now()
        await bucket.acquire()
        const elapsed = Date.now() - start

        // Should wait for first refill (~100ms)
        expect(elapsed).toBeGreaterThanOrEqual(90)
        expect(elapsed).toBeLessThan(200)
    })

    test.concurrent("initial tokens available, acquire returns immediately", async () => {
        const bucket = new TokenBucket({
            capacity: 10,
            refillRate: 1,
            refillInterval: 100,
            initialTokens: 5
        })

        const start = Date.now()
        await bucket.acquire()
        await bucket.acquire()
        await bucket.acquire()
        const elapsed = Date.now() - start

        // Should return immediately (3 tokens consumed from 5)
        expect(elapsed).toBeLessThan(50)
    })

    test.concurrent("tokens refill over time", async () => {
        const bucket = new TokenBucket({
            capacity: 10,
            refillRate: 2,
            refillInterval: 100,
            initialTokens: 0
        })

        // Wait for 2 refill intervals
        await sleep(210)

        const start = Date.now()
        // Should have 4 tokens (2 per interval * 2 intervals)
        await bucket.acquire()
        await bucket.acquire()
        await bucket.acquire()
        await bucket.acquire()
        const elapsed = Date.now() - start

        expect(elapsed).toBeLessThan(50)
    })

    test.concurrent("tokens do not exceed capacity", async () => {
        const bucket = new TokenBucket({
            capacity: 3,
            refillRate: 10,
            refillInterval: 100,
            initialTokens: 0
        })

        // Wait for refill (would be 10 tokens, but capped at 3)
        await sleep(110)

        const start = Date.now()
        await bucket.acquire()
        await bucket.acquire()
        await bucket.acquire()
        const firstThree = Date.now() - start

        // First 3 should be immediate
        expect(firstThree).toBeLessThan(50)

        // 4th should wait for refill
        const start2 = Date.now()
        await bucket.acquire()
        const fourth = Date.now() - start2

        expect(fourth).toBeGreaterThanOrEqual(50)
    })

    test.concurrent("multiple waiters are processed in order", async () => {
        const bucket = new TokenBucket({
            capacity: 10,
            refillRate: 1,
            refillInterval: 100,
            initialTokens: 0
        })

        const results: number[] = []

        const p1 = bucket.acquire().then(() => results.push(1))
        const p2 = bucket.acquire().then(() => results.push(2))
        const p3 = bucket.acquire().then(() => results.push(3))

        await Promise.all([p1, p2, p3])

        expect(results).toEqual([1, 2, 3])
    })
})

describe("LeakyBucket", () => {
    test.concurrent("first acquire returns immediately", async () => {
        const bucket = new LeakyBucket({
            leakRate: 1,
            leakInterval: 1000
        })

        const start = Date.now()
        await bucket.acquire()
        const elapsed = Date.now() - start

        expect(elapsed).toBeLessThan(50)
    })

    test.concurrent("subsequent acquires are rate-limited", async () => {
        const bucket = new LeakyBucket({
            leakRate: 10,
            leakInterval: 1000  // 10 per second = 100ms interval per task
        })

        const start = Date.now()
        await bucket.acquire()  // immediate
        await bucket.acquire()  // wait ~100ms
        await bucket.acquire()  // wait ~100ms
        const elapsed = Date.now() - start

        // Should take ~200ms for 3 acquires (first immediate, then 2 * 100ms)
        expect(elapsed).toBeGreaterThanOrEqual(150)
        expect(elapsed).toBeLessThan(350)
    })

    test.concurrent("rate is consistent", async () => {
        const bucket = new LeakyBucket({
            leakRate: 5,
            leakInterval: 500  // 5 per 500ms = 100ms interval per task
        })

        const timestamps: number[] = []
        const start = Date.now()

        for (let i = 0; i < 5; i++) {
            await bucket.acquire()
            timestamps.push(Date.now() - start)
        }

        // Check intervals between acquires
        // First should be ~0, then ~100, ~200, ~300, ~400
        expect(timestamps[0]).toBeLessThan(50)
        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i - 1]
            expect(interval).toBeGreaterThanOrEqual(80)
            expect(interval).toBeLessThan(150)
        }
    })

    test.concurrent("multiple waiters are processed at steady rate", async () => {
        const bucket = new LeakyBucket({
            leakRate: 2,
            leakInterval: 200  // 2 per 200ms = 100ms interval per task
        })

        const results: {id: number, time: number}[] = []
        const start = Date.now()

        const promises = [1, 2, 3, 4].map(id =>
            bucket.acquire().then(() => results.push({id, time: Date.now() - start}))
        )

        await Promise.all(promises)

        // All should complete in order
        expect(results.map(r => r.id)).toEqual([1, 2, 3, 4])

        // Timing: ~0ms, ~100ms, ~200ms, ~300ms
        expect(results[0].time).toBeLessThan(50)
        expect(results[1].time).toBeGreaterThanOrEqual(80)
        expect(results[2].time).toBeGreaterThanOrEqual(180)
        expect(results[3].time).toBeGreaterThanOrEqual(280)
    })
})