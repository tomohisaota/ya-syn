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
        return new Promise<void>(resolve => {
            setTimeout(() => {
                this.dump(clear)
                resolve()
            }, 1000)
        })
    }

    dump(clear = true) {
        console.table(this.events.flatMap(i => ({
            providerId: i.context.providerId,
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