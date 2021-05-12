import COMMANDS from './commands/client.js';
import { RedisCommand, RedisModule, RedisModules, RedisReply } from './commands/index.js';
import RedisCommandsQueue from './commands-queue.js';

type RedisMultiCommandSignature<C extends RedisCommand, M extends RedisModules> = (...args: Parameters<C['transformArguments']>) => RedisMultiCommandType<M>;

type RedisMultiWithCommands<M extends RedisModules> = {
    [P in keyof typeof COMMANDS]: RedisMultiCommandSignature<(typeof COMMANDS)[P], M>
};

type RedisMultiWithModules<M extends Array<RedisModule>> = {
    [P in keyof M[number]]: RedisMultiCommandSignature<M[number][P], M>
};

export type RedisMultiCommandType<M extends RedisModules> = RedisMultiCommand & RedisMultiWithCommands<M> & RedisMultiWithModules<M>;

export interface MultiQueuedCommand {
    encodedCommand: string;
    transformReply?: RedisCommand['transformReply'];
}

export type RedisMultiExecutor = (encodedCommands: Array<MultiQueuedCommand>, chainId: Symbol) => Promise<Array<RedisReply>>;

export default class RedisMultiCommand {
    static defineCommand(on: any, name: string, command: RedisCommand) {
        on[name] = function (...args: Array<unknown>) {
            return this.addCommand(command.transformArguments(...args), command.transformReply);
        };
    }

    static create<M extends RedisModules>(executor: RedisMultiExecutor, modules?: M): RedisMultiCommandType<M> {
        return <any>new RedisMultiCommand(executor, modules);
    }

    readonly #executor: RedisMultiExecutor;

    readonly #queue: Array<MultiQueuedCommand> = [];

    constructor(executor: RedisMultiExecutor, modules?: RedisModules) {
        this.#executor = executor;
        this.#initiateModules(modules);
    }

    #initiateModules(modules?: RedisModules) {
        if (!modules) return;

        for (const m of modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisMultiCommand.defineCommand(this, name, command);
            }
        }
    }

    addCommand(args: Array<string>, transformReply?: RedisCommand['transformReply']): this {
        this.#queue.push({
            encodedCommand: RedisCommandsQueue.encodeCommand(args),
            transformReply
        });

        return this;
    }

    async exec(): Promise<Array<unknown>> {
        const results = await this.#executor(this.#queue, Symbol('[RedisMultiCommand] Chain ID'));
        return this.#queue.map(({transformReply}, i) => {
            const reply = results[i];
            return transformReply ? transformReply(reply) : reply;
        });
    };
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisMultiCommand.defineCommand(RedisMultiCommand.prototype, name, command);
}
