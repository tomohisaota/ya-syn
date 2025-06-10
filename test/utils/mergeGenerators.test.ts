import {mergeAsyncGenerators} from "../../src";

async function* numberAsyncGenerator(batch: number, max: number, throwErrorAt?: number): AsyncGenerator<string, void> {
    for (let i = 0; i < max; i++) {
        if (i === throwErrorAt) {
            throw new Error(`Error at batch:${batch} i:${i}`)
        }
        await new Promise((resolve): void => {
            setTimeout(resolve, 10)
        })
        yield `${batch}-${i}`
    }
}

describe("mergeGenerators", () => {

    test.concurrent('single', async () => {
        const results: string[] = []
        for await(const i of mergeAsyncGenerators([
            numberAsyncGenerator(0, 3),
        ])) {
            results.push(i)
        }
        expect(results).toStrictEqual([
            `0-0`,
            `0-1`,
            `0-2`,
        ])
    });

    test.concurrent('three sources', async () => {
        const results: string[] = []
        for await(const i of mergeAsyncGenerators([
            numberAsyncGenerator(0, 3),
            numberAsyncGenerator(1, 3),
            numberAsyncGenerator(2, 3),
        ])) {
            results.push(i)
        }
        expect(results).toStrictEqual([
            `0-0`,
            `1-0`,
            `2-0`,
            `0-1`,
            `1-1`,
            `2-1`,
            `0-2`,
            `1-2`,
            `2-2`,
        ])
    });

    test.concurrent('three sources with error', async () => {
        try {
            for await(const i of mergeAsyncGenerators([
                numberAsyncGenerator(0, 3),
                numberAsyncGenerator(1, 3, 1),
                numberAsyncGenerator(2, 3),
            ])) {
            }
            fail("Execution should have been interrupted by Error")
        } catch (e) {
            if (!(e instanceof Error)) {
                throw e
            }
            expect(e.message).toBe("Error at batch:1 i:1")
        }
    });

})

