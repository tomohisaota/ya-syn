import {SynchronizerEvent, SynchronizerEventType} from "../src";

export class StateTransitionChecker {

    count = 0
    events: SynchronizerEvent[] = []
    states: { [executionId: string]: string[] } = {}

    onEvent(event: SynchronizerEvent) {
        this.events.push(event)
        const key = [
            event.context.providerId ?? "",
            event.context.synchronizerId ?? "",
            event.context.executionId ?? "",
        ].join("/")
        if (!(key in this.states)) {
            this.states[key] = []
        }
        const mapping: { [key in SynchronizerEventType]: string } = {
            "Acquire": "AC",
            "Acquired": "AD",
            "Cancel": "CA",
            "Enter": "EN",
            "Exit": "EX",
            "Release": "RE",
            "Finish": "FI",
            "Timeout": "TI",
            "Throttle": "TH",
        }
        this.states[key][this.count++] = mapping[event.type]
    }

    async dumpLater(clear = true) {
        return new Promise<void>((resolve): void => {
            setTimeout(() => {
                this.dump(clear)
                resolve()
            }, 500)
        })
    }

    dump(clear = true) {
        console.table(this.events.flatMap(i => ({
            // providerId: i.context.providerId,
            synchronizerId: i.context.synchronizerId,
            executionId: i.context.executionId,
            type: i.type,
            maxConcurrentExecution: i.stats.maxConcurrentExecution,
            numberOfTasks: i.stats.numberOfTasks,
            numberOfRunningTasks: i.stats.numberOfRunningTasks,
        })))
        console.table(this.states)
        if (clear) {
            this.clear()
        }
        return this
    }

    clear() {
        this.events = []
        this.states = {}
        this.count = 0
        return this
    }

    get fn() {
        return this.onEvent.bind(this)
    }
}


/*

> ya-syn@1.1.1 test
> jest --verbose test/CachedProvider.test.ts

  console.log
    Map(0) {}

      at test/CachedProvider.test.ts:119:17

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3dba864d-199b-47a9-a90d-037911043d1f' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3dba864d-199b-47a9-a90d-037911043d1f' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3dba864d-199b-47a9-a90d-037911043d1f' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3dba864d-199b-47a9-a90d-037911043d1f' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                             │ 0    │ 1    │ 2    │ 3    │
    ├─────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/3dba864d-199b-47a9-a90d-037911043d1f │ 'AC' │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c59f6d0c-4471-43c2-87f6-579a1b98466b' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c59f6d0c-4471-43c2-87f6-579a1b98466b' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c59f6d0c-4471-43c2-87f6-579a1b98466b' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c59f6d0c-4471-43c2-87f6-579a1b98466b' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '39e32cc4-47f0-4de1-aeb2-9a24f039aec6' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '39e32cc4-47f0-4de1-aeb2-9a24f039aec6' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '39e32cc4-47f0-4de1-aeb2-9a24f039aec6' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '39e32cc4-47f0-4de1-aeb2-9a24f039aec6' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                             │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │
    ├─────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/c59f6d0c-4471-43c2-87f6-579a1b98466b │ 'AC' │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/39e32cc4-47f0-4de1-aeb2-9a24f039aec6 │      │      │      │      │ 'AC' │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5397135f-abe3-4fcf-9b2c-a438b00206b5' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5397135f-abe3-4fcf-9b2c-a438b00206b5' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5397135f-abe3-4fcf-9b2c-a438b00206b5' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5397135f-abe3-4fcf-9b2c-a438b00206b5' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c3710083-e0c8-44ab-a868-3697b014c3e8' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c3710083-e0c8-44ab-a868-3697b014c3e8' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c3710083-e0c8-44ab-a868-3697b014c3e8' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'c3710083-e0c8-44ab-a868-3697b014c3e8' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                             │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │
    ├─────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/5397135f-abe3-4fcf-9b2c-a438b00206b5 │ 'AC' │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/c3710083-e0c8-44ab-a868-3697b014c3e8 │      │      │      │      │ 'AC' │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e93298f7-7604-4117-8264-c4c86e7e3adc' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e93298f7-7604-4117-8264-c4c86e7e3adc' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '44313441-bfd4-4f54-af62-76ce172d5f0e' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '90a1808b-02dd-48a6-be60-e9231f59fe45' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '714ff125-5d16-4e53-beca-c43204cee0a8' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '95395127-f558-4b08-a353-a95a33234254' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e93298f7-7604-4117-8264-c4c86e7e3adc' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e93298f7-7604-4117-8264-c4c86e7e3adc' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '44313441-bfd4-4f54-af62-76ce172d5f0e' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '44313441-bfd4-4f54-af62-76ce172d5f0e' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '44313441-bfd4-4f54-af62-76ce172d5f0e' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '90a1808b-02dd-48a6-be60-e9231f59fe45' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '90a1808b-02dd-48a6-be60-e9231f59fe45' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '90a1808b-02dd-48a6-be60-e9231f59fe45' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '714ff125-5d16-4e53-beca-c43204cee0a8' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '714ff125-5d16-4e53-beca-c43204cee0a8' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '714ff125-5d16-4e53-beca-c43204cee0a8' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '95395127-f558-4b08-a353-a95a33234254' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '95395127-f558-4b08-a353-a95a33234254' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '95395127-f558-4b08-a353-a95a33234254' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 20      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '16cf6a2f-906d-4687-aa12-4af15e53f73b' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 21      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '16cf6a2f-906d-4687-aa12-4af15e53f73b' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 22      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3807433a-890d-4c78-b233-b4f76a4967c7' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 23      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77134a98-14b6-46c8-bcf1-fa7c528e5c80' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 24      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5c15e2c6-961c-4a18-87ae-852bcc5b7902' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 25      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77dd8bf2-3347-417d-b7d0-f73de801d5a3' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 26      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '16cf6a2f-906d-4687-aa12-4af15e53f73b' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 27      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '16cf6a2f-906d-4687-aa12-4af15e53f73b' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3807433a-890d-4c78-b233-b4f76a4967c7' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3807433a-890d-4c78-b233-b4f76a4967c7' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 30      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3807433a-890d-4c78-b233-b4f76a4967c7' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77134a98-14b6-46c8-bcf1-fa7c528e5c80' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77134a98-14b6-46c8-bcf1-fa7c528e5c80' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 33      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77134a98-14b6-46c8-bcf1-fa7c528e5c80' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5c15e2c6-961c-4a18-87ae-852bcc5b7902' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5c15e2c6-961c-4a18-87ae-852bcc5b7902' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 36      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '5c15e2c6-961c-4a18-87ae-852bcc5b7902' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77dd8bf2-3347-417d-b7d0-f73de801d5a3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 38      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77dd8bf2-3347-417d-b7d0-f73de801d5a3' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 39      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '77dd8bf2-3347-417d-b7d0-f73de801d5a3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                             │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │ 38   │ 39   │
    ├─────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/e93298f7-7604-4117-8264-c4c86e7e3adc │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/44313441-bfd4-4f54-af62-76ce172d5f0e │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/90a1808b-02dd-48a6-be60-e9231f59fe45 │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/714ff125-5d16-4e53-beca-c43204cee0a8 │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/95395127-f558-4b08-a353-a95a33234254 │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/16cf6a2f-906d-4687-aa12-4af15e53f73b │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/3807433a-890d-4c78-b233-b4f76a4967c7 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/77134a98-14b6-46c8-bcf1-fa7c528e5c80 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/5c15e2c6-961c-4a18-87ae-852bcc5b7902 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/77dd8bf2-3347-417d-b7d0-f73de801d5a3 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '263087aa-1bdd-4142-a7ed-d1b2a2eb74aa' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '263087aa-1bdd-4142-a7ed-d1b2a2eb74aa' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3a3890c2-c877-4ee5-89d8-130a87537847' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '38b6ac7b-982f-475b-8319-7058ff2cf7bc' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '0779e57a-17c4-40a6-a625-53087d44ac5c' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '6ed46495-7afe-4ad7-b77e-71daef79f762' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '263087aa-1bdd-4142-a7ed-d1b2a2eb74aa' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '263087aa-1bdd-4142-a7ed-d1b2a2eb74aa' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3a3890c2-c877-4ee5-89d8-130a87537847' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3a3890c2-c877-4ee5-89d8-130a87537847' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '3a3890c2-c877-4ee5-89d8-130a87537847' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '38b6ac7b-982f-475b-8319-7058ff2cf7bc' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '38b6ac7b-982f-475b-8319-7058ff2cf7bc' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '38b6ac7b-982f-475b-8319-7058ff2cf7bc' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '0779e57a-17c4-40a6-a625-53087d44ac5c' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '0779e57a-17c4-40a6-a625-53087d44ac5c' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '0779e57a-17c4-40a6-a625-53087d44ac5c' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '6ed46495-7afe-4ad7-b77e-71daef79f762' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '6ed46495-7afe-4ad7-b77e-71daef79f762' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '6ed46495-7afe-4ad7-b77e-71daef79f762' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 20      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'bceed337-0f22-458d-bdad-223e96fe2e53' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 21      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '4df9ec8a-aa64-4070-8d66-a24f6de89e2a' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 22      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '1a8522aa-35d7-41c3-a241-495fbccd6934' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 23      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e495861c-914a-4be2-9ea7-ba764b01bd3a' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 24      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'd571141e-26fb-4770-b6f4-4db11ae8362c' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 25      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'bceed337-0f22-458d-bdad-223e96fe2e53' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 26      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'bceed337-0f22-458d-bdad-223e96fe2e53' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 27      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'bceed337-0f22-458d-bdad-223e96fe2e53' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '4df9ec8a-aa64-4070-8d66-a24f6de89e2a' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '4df9ec8a-aa64-4070-8d66-a24f6de89e2a' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 30      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '4df9ec8a-aa64-4070-8d66-a24f6de89e2a' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '1a8522aa-35d7-41c3-a241-495fbccd6934' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '1a8522aa-35d7-41c3-a241-495fbccd6934' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 33      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ '1a8522aa-35d7-41c3-a241-495fbccd6934' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e495861c-914a-4be2-9ea7-ba764b01bd3a' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e495861c-914a-4be2-9ea7-ba764b01bd3a' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 36      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'e495861c-914a-4be2-9ea7-ba764b01bd3a' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'd571141e-26fb-4770-b6f4-4db11ae8362c' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 38      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'd571141e-26fb-4770-b6f4-4db11ae8362c' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 39      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'd571141e-26fb-4770-b6f4-4db11ae8362c' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                             │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │ 38   │ 39   │
    ├─────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/263087aa-1bdd-4142-a7ed-d1b2a2eb74aa │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/3a3890c2-c877-4ee5-89d8-130a87537847 │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/38b6ac7b-982f-475b-8319-7058ff2cf7bc │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/0779e57a-17c4-40a6-a625-53087d44ac5c │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/6ed46495-7afe-4ad7-b77e-71daef79f762 │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/bceed337-0f22-458d-bdad-223e96fe2e53 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/4df9ec8a-aa64-4070-8d66-a24f6de89e2a │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/1a8522aa-35d7-41c3-a241-495fbccd6934 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/e495861c-914a-4be2-9ea7-ba764b01bd3a │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/d571141e-26fb-4770-b6f4-4db11ae8362c │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */