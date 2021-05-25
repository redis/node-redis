export class AbortError extends Error {
    constructor() {
        super('The command was aborted');
    }
}
