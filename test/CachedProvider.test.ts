import {SynchronizerProvider} from "../src";
import {sleep} from "./utils";
import {CachedProvider} from "../src/CachedProvider";


describe("CachedProvider", () => {
    const sp = new SynchronizerProvider({
        providerId: "CachedProvider",
    })

    test.concurrent('with timeout', async () => {
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => count++
        })
        expect(await cache.get(100)).toBe(0)
        await sleep(10) // still in cache
        expect(await cache.get(100)).toBe(0)
        await sleep(100) // wait until cache expires
        expect(await cache.get(100)).toBe(1)
        expect(count).toBe(2)
    });

    test.concurrent('without timeout', async () => {
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => {
                await sleep(300)
                return count++
            }
        })
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([1, 1, 1, 1, 1])
    });

    test.concurrent('override default ttl', async () => {
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => {
                await sleep(300)
                return count++
            },
            defaultTTL: 500
        })
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        // after TTL, new value
        await sleep(500)
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([1, 1, 1, 1, 1])
    });

    test.concurrent('with capture', async () => {
        let count = 0
        const cache = CachedProvider.capture({
            variable1: new Set<number>()
        }, ({variable1}) => sp
            .createCachedProvider({
                factory: async () => {
                    const i = count++
                    variable1.add(i)
                    expect(variable1.size).toBe(count)
                    return i
                }
            }))
        expect(await cache.get(100)).toBe(0)
        await sleep(10) // still in cache
        expect(await cache.get(100)).toBe(0)
        await sleep(100) // wait until cache expires
        expect(await cache.get(100)).toBe(1)
        expect(count).toBe(2)
    });
})