import {increment100Times, sleep, TestClass} from "./utils";
import {SynchronizerProvider, SynchronizerTimeoutError} from "../src";


describe("SynchronizerProvider", () => {
    const sp = new SynchronizerProvider({
        providerId: "UnitTest",
    })

    test.concurrent('use object for key', async () => {
        const obj = {}
        expect(await increment100Times(() => sp.forObject(obj), true)).toBe(100)
    });

    test.concurrent('use instance for key', async () => {
        const obj = new TestClass()
        expect(await increment100Times(() => sp.forObject(obj), true)).toBe(100)
    });


    test.concurrent('use string key', async () => {
        expect(await increment100Times(() => sp.forKey("key"), true)).toBe(100)
    });

    test.concurrent('synchronizer for key string', async () => {
        expect(sp.forKey("")).toBe(sp.forKey(""))
        expect(sp.forKey("aaa")).toBe(sp.forKey("aaa"))
        expect(sp.forKey("")).not.toBe(sp.forKey("bbb"))
        expect(sp.forKey("aaa")).not.toBe(sp.forKey("bbb"))
    });
})

describe("ClassWithInstanceSynchronizer", () => {
    const sp = new SynchronizerProvider({
        providerId: "ClassWithInstanceSynchronizer",
        // onEvent: (event) => console.log(event)
    })

    class ClassWithInstanceSynchronizer {
        readonly sInstance = sp.forObject(this)
        readonly sClass = sp.forObject(ClassWithInstanceSynchronizer)

        count = 0

        async getCount() {
            return this.sInstance.synchronized(async () => {
                return this.count
            })
        }

        async setCount(count: number) {
            return this.sInstance.synchronized(async () => {
                this.count = count
            })
        }

        async increment1(wait: number) {
            // update internal value directory
            return this.sInstance.synchronized(async () => {
                const count = this.count
                await sleep(wait)
                this.count = count + 1
            })
        }

        async increment2(wait: number) {
            // get/set value using other method
            return this.sInstance.synchronized(async () => {
                const count = await this.getCount()
                await sleep(wait)
                await this.setCount(count + 1)
            })
        }

        async increment3(wait: number) {
            const count = this.count
            // below code block is not synchronized. need external lock
            await sleep(wait)
            //
            this.count = count + 1
        }
    }

    test.concurrent('increment using increment1 method', async () => {
        const t = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return t.increment1(10)
        }))
        expect(t.count).toBe(100)
    });

    test.concurrent('increment using increment2 method', async () => {
        const t = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return t.increment2(10)
        }))
        expect(t.count).toBe(100)
    });

    test.concurrent('increment using increment3 method -> no synchronization', async () => {
        const t = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return t.increment3(10)
        }))
        expect(t.count).toBe(1) // no synchronization
    });

    test.concurrent('increment using increment3 method using external instance synchronizer', async () => {
        const t = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return t.sInstance.synchronized(() => t.increment3(10))
        }))
        expect(t.count).toBe(100)
    });

    test.concurrent('increment using increment3 method using external class synchronizer', async () => {
        const t = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return t.sClass.synchronized(() => t.increment3(10))
        }))
        expect(t.count).toBe(100)
    });

    test.concurrent('use semaphore(2)', async () => {
        // With 10ms sleep, multiple workers starts work at the same time doing the duplicated works
        // This is not best way to test semaphore...
        const t = new ClassWithInstanceSynchronizer()
        const s = sp.forObject({}, 2)
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return s.synchronized(() => t.increment3(10))
        }))
        expect(t.count).toBe(50) // half
    });

    test.concurrent('use semaphore(20)', async () => {
        // With 10ms sleep, multiple workers starts work at the same time doing the duplicated works
        // This is not best way to test semaphore...
        const t = new ClassWithInstanceSynchronizer()
        const semaphore = sp.forObject({}, 20)
        await Promise.all([...Array(100)].map((_, i) => i).map(_ => {
            return semaphore.synchronized(() => t.increment3(10))
        }))
        expect(t.count).toBe(5) // half
    });

    test.concurrent('3 instances', async () => {
        const t1 = new ClassWithInstanceSynchronizer()
        const t2 = new ClassWithInstanceSynchronizer()
        const t3 = new ClassWithInstanceSynchronizer()
        await Promise.all([...Array(100)].map((_, i) => i).map(async (_) => {
            return Promise.all([
                t1.increment1(10),
                t2.increment2(10),
                t3.increment3(10),
            ])
        }))
        expect(t1.count).toBe(100)
        expect(t2.count).toBe(100)
        expect(t3.count).toBe(1)
    });
})

describe("WithThrottle", () => {
    const sp = new SynchronizerProvider({
        providerId: "WithThrottle",
        onEvent: e => console.log(e)
    })
    test.concurrent('without throttle', async () => {
        const s = sp.forObject({}, 2)
        const tasks: Promise<void>[] = []
        let count = 0
        for (let i = 0; i < 10; i++) {
            tasks.push(s.synchronized(async () => {
                await sleep(10)
                count++
            }))
        }
        await Promise.allSettled(tasks)
        expect(count).toBe(10)
    });

    test.concurrent('with throttle', async () => {
        const s = sp.forObject({}, 2)
        const tasks: Promise<void>[] = []
        let count = 0
        for (let i = 0; i < 10; i++) {
            tasks.push(s.throttle().synchronized(async () => {
                count++
                await sleep(10)
            }))
        }
        const results = await Promise.allSettled(tasks)
        console.log(results)
        expect(results.filter(i => i.status === "fulfilled").length).toBe(2)
        expect(count).toBe(2)
    });

    test.concurrent('with throttle + reenter', async () => {
        const s = sp.forObject({}, 2)
        const tasks: Promise<void>[] = []
        let count = 0
        for (let i = 0; i < 10; i++) {
            tasks.push(s.throttle().synchronized(async () => {
                await s.throttle().synchronized(async () => {
                    count++
                    await sleep(10)
                })
            }))
        }
        const results = await Promise.allSettled(tasks)
        console.log(results)
        expect(results.filter(i => i.status === "fulfilled").length).toBe(2)
        expect(count).toBe(2)
    });


})


describe("WithTimeout", () => {
    const sp = new SynchronizerProvider({
        providerId: "WithTimeout",
    })


    test.concurrent('no timeout', async () => {
        const s = sp.forObject({}, 1)
        const tasks: Promise<void>[] = []
        tasks.push(s.synchronized(async () => {
            await sleep(100)
        }))
        tasks.push(s.timeout(600).synchronized(async () => {
            await sleep(200)
        }))
        await Promise.all(tasks)
    });

    test.concurrent('timeout before acquiring lock', async () => {
        const s = sp.forObject({}, 1)
        const tasks: Promise<void>[] = []
        tasks.push(s.synchronized(async () => {
            await sleep(1000)
        }))
        tasks.push(s.timeout(200).synchronized(async () => {
            await sleep(1000)
        }))
        await expect(Promise.all(tasks)).rejects.toThrow(SynchronizerTimeoutError)

    });
})
