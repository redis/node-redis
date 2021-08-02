export class AbortError extends Error {
    constructor() {
        super('The command was aborted');
    }
}

export class WatchError extends Error {
    constructor() {
        super('One (or more) of the watched keys has been changed');
    }
}
