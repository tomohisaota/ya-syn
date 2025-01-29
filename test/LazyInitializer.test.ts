import {LazyInitializer, SynchronizerReentrantExecutionError} from "../src";


describe("LazyInitializer", () => {
    test.concurrent('factory method not called before calling get', async () => {
        let count = 0
        const i = new LazyInitializer(async () => count++)
        expect(count).toBe(0) // not called yet
        expect(await i.get()).toBe(0)
        expect(count).toBe(1) // called
    });


    test.concurrent('factory method called only once', async () => {
        let count = 0
        const i = new LazyInitializer(async () => count++)
        const tasks: Promise<void>[] = []
        for (let j = 0; j < 100; j++) {
            tasks.push((async () => {
                expect(await i.get()).toBe(0)
            })())
        }
        await Promise.all(tasks)
        expect(count).toBe(1)
        expect(await i.get()).toBe(0)
    });

    test.concurrent('exception handling', async () => {
        let count = 0
        const i = new LazyInitializer(async () => {
            throw count++
        })
        const tasks: Promise<void>[] = []
        for (let j = 0; j < 100; j++) {
            tasks.push((async () => {
                try {
                    await i.get()
                } catch (e) {
                    // exception is called for every get()
                    expect(count).toBe(j + 1)
                }
            })())
        }
        await Promise.allSettled(tasks)
        expect(count).toBe(100)
    });

    test.concurrent('circular dependency', async () => {
        class TestClass {
            a = new LazyInitializer<void>(async () => {
                await this.b.get()
            })
            b = new LazyInitializer<void>(async () => {
                await this.a.get()
            })
            c = new LazyInitializer<void>(async () => {
                await this.c.get()
            })
        }

        const t = new TestClass()
        // a->b->a
        await expect(t.a.get()).rejects.toThrow(SynchronizerReentrantExecutionError)
        // c->c
        await expect(t.c.get()).rejects.toThrow(SynchronizerReentrantExecutionError)
    });
})
