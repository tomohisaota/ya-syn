import {sleep} from "../utils";
import {LazyInitializer, SynchronizerEvent, SynchronizerProvider} from "../../src";

describe("Async Singleton", () => {

    test.concurrent("get multiple times in parallel", async () => {
        let count = 0
        const singleton = new LazyInitializer(async () => {
            await sleep(1000)
            return count++
        })
        // initializer called only once
        expect(await Promise.all([
            singleton.get(),
            singleton.get(),
            singleton.get(),
            singleton.get(),
            singleton.get(),
        ])).toEqual([0, 0, 0, 0, 0])
    })

})