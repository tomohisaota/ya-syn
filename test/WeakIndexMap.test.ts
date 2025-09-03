import {WeakCacheProvider} from "../src/WeakCacheProvider";
import {WeakIndexMap} from "../src";

const gcMarker = {}

class WeakIndexMapForGcTest extends WeakIndexMap<number, object> {
    isGarbageCollected(target?: object): boolean {
        return target === undefined || target === gcMarker
    }
}

describe("WeakIndexMap", () => {
    test.concurrent('return same object for same key', async () => {
        const p = new WeakIndexMap({
            toKey: (i) => `${i}`,
            toIndex: (i) => ({
                i,
            })
        })
        for (let i = 0; i < 1000; i++) {
            const index = p.get(i)
            expect(index.i).toBe(i)
            expect(p.size).toBe(i + 1)
            expect(index).toBe(p.get(i))
        }
    })

    test.concurrent('manual gc', async () => {
        const p = new WeakIndexMapForGcTest({
            toKey: (i) => `${i}`,
            toIndex: (i) => i % 2 === 0 ? gcMarker : {},// half of objects will be freed
        })
        for (let i = 0; i < 1000; i++) {
            p.get(i)
        }
        expect(p.size).toBe(1000)
        p.gc()
        expect(p.size).toBe(500)
    })

    test.concurrent('auto gc', async () => {
        const p = new WeakIndexMapForGcTest({
            toKey: (i) => `${i}`,
            toIndex: (i) => i % 2 === 0 ? gcMarker : {}, // half of objects will be freed
            gcInterval: 500
        })
        for (let i = 0; i < 1000; i++) {
            p.get(i)
        }
        expect(p.size).toBe(1000)
        // wait until scheduled gc is complete
        await new Promise(r => setTimeout(r, 1000))
        expect(p.size).toBe(500)
    })
})
