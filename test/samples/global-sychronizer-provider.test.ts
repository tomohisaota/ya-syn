import {SynchronizerProvider} from "../../src";

/*
Synchronizer provider for samples
 */

export const gsp = new SynchronizerProvider({
    providerId: "MyGlobalSynchronizerProvider",
    onEvent: (event) => console.log(event)
})

describe("MyGlobalSynchronizerProvider", () => {

    test.concurrent("nextId", async () => {
        expect(gsp.nextId()).toBe(0)
        expect(gsp.nextId()).toBe(1)
    })

})