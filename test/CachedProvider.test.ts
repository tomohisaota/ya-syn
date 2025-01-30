import {createSynchronizerProvider, sleep} from "./utils";
import {CachedProvider} from "../src";


describe("CachedProvider", () => {

    test('with timeout', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
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
        checker.dump().clear()
    });

    test('without timeout', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
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
        checker.dump().clear()
    });

    test.concurrent('override default ttl', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
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
        checker.dump().clear()
    });

    test.concurrent('with capture', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
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
        await checker.dumpLater()
    });

    test.concurrent('with capture', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = CachedProvider.capture({
            variable1: new Set<number>()
        }, ({variable1}) => sp
            .createCachedProvider({
                factory: async () => {
                    variable1.add(count++)
                    return new Map<string, string>()
                }
            }))
        console.log(await cache.get())
        await checker.dumpLater()
    });
})