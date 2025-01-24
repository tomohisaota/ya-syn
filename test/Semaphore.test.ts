import {increment100Times, increment100Times2} from "./utils";
import {Semaphore} from "../src";


describe("Without Synchronizer", () => {
    test.concurrent('increment100Times', async () => {
        expect(await increment100Times(() => undefined)).toBe(1)
    });
})

describe("with Semaphore", () => {
    test.concurrent('increment100Times', async () => {
        const s = new Semaphore(1)
        expect(await increment100Times2(() => s)).toBe(100)
    });

    test.concurrent('increment100Times', async () => {
        const s = new Semaphore(2)
        expect(await increment100Times2(() => s)).toBe(50)
    });

    test.concurrent('increment100Times', async () => {
        const s = new Semaphore(25)
        expect(await increment100Times2(() => s)).toBe(4)
    });

    test.concurrent('increment100Times', async () => {
        const s = new Semaphore(100)
        expect(await increment100Times2(() => s)).toBe(1)
    });
})