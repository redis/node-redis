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

export class ConnectionTimeoutError extends Error {
    constructor() {
        super('Connection timeout');
    }
}

export class ClientClosedError extends Error {
    constructor() {
        super('The client is closed');
    }
}

export class DisconnectsClientError extends Error {
    constructor() {
        super('Disconnects client');
    }
}

export class SocketClosedUnexpectedlyError extends Error {
    constructor() {
        super('Socket closed unexpectedly');
    }
}
