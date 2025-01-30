import {Semaphore, SynchronizerProvider} from "../src"
import {Synchronizer} from "../src/Synchronizer";
import {StateTransitionChecker} from "./StateTransitionChecker";
import path from "node:path";

export function createSynchronizerProvider(filename: string) {
    const checker = new StateTransitionChecker()

    const sp = new SynchronizerProvider({
        providerId: path.basename(filename),
        onEvent: checker.fn
    })
    return {checker, sp}
}

export class TestClass {
    counter = 0
}

export async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
}

export async function increment100Times(p: () => Synchronizer | undefined, doubleLock?: boolean): Promise<number> {
    const t = new TestClass()
    expect(t.counter).toBe(0)
    const tasks: Promise<void>[] = []

    const cb = async () => {
        const i = t.counter
        await sleep(10)
        t.counter = i + 1
    }

    for (let i = 0; i < 100; i++) {
        tasks.push((async () => {
            const s = p()
            if (s) {
                if (doubleLock) {
                    await s.synchronized({
                        cb: async () => s.synchronized({
                            executionId: `${i}-inner`,
                            cb
                        }),
                        executionId: `${i}-outer`
                    })
                } else {
                    await s.synchronized({
                        executionId: `${i}`,
                        cb
                    })
                }
            } else {
                await cb()
            }
        })())
    }
    await Promise.all(tasks)
    return t.counter
}

export async function increment100Times2(p: () => Semaphore, doubleLock?: boolean): Promise<number> {
    const t = new TestClass()
    expect(t.counter).toBe(0)
    const tasks: Promise<void>[] = []

    const cb = async () => {
        const i = t.counter
        await sleep(10)
        t.counter = i + 1
    }

    for (let i = 0; i < 100; i++) {
        tasks.push((async () => {
            const s = p()
            if (s) {
                if (doubleLock) {
                    await s.synchronized(async () => s.synchronized(cb)
                    )
                } else {
                    await s.synchronized(cb)
                }
            } else {
                await cb()
            }
        })())
    }
    await Promise.all(tasks)
    return t.counter
}