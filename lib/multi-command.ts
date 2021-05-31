import COMMANDS from './commands/client';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import RedisCommandsQueue from './commands-queue';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';

type RedisMultiCommandSignature<C extends RedisCommand, M extends RedisModules, S extends RedisLuaScripts> = (...args: Parameters<C['transformArguments']>) => RedisMultiCommandType<M, S>;

type WithCommands<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof typeof COMMANDS]: RedisMultiCommandSignature<(typeof COMMANDS)[P], M, S>
};

type WithModules<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof M[number]]: RedisMultiCommandSignature<M[number][P], M, S>
};

type WithScripts<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof S]: RedisMultiCommandSignature<S[P], M, S>
};

export type RedisMultiCommandType<M extends RedisModules, S extends RedisLuaScripts> = RedisMultiCommand & WithCommands<M, S> & WithModules<M, S> & WithScripts<M, S>;

export interface MultiQueuedCommand {
    encodedCommand: string;
    transformReply?: RedisCommand['transformReply'];
}

export type RedisMultiExecutor = (queue: Array<MultiQueuedCommand>, chainId: Symbol) => Promise<Array<RedisReply>>;

export default class RedisMultiCommand<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> {
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = function (...args: Parameters<typeof command.transformArguments>) {
            return this.addCommand(command.transformArguments(...args), command.transformReply);
        };
    }

    static defineLuaScript(on: any, name: string, script: RedisLuaScript): void {
        on[name] = function (...args: Array<unknown>) {
            let evalArgs;
            if (this.#scriptsInUse.has(name)) {
                evalArgs = [
                    'EVALSHA',
                    script.SHA
                ];
            } else {
                this.#scriptsInUse.add(name);
                evalArgs = [
                    'EVAL',
                    script.SCRIPT
                ];
            }

            return this.addCommand(
                [
                    ...evalArgs,
                    script.NUMBER_OF_KEYS,
                    ...script.transformArguments(...args)
                ],
                script.transformReply
            );
        };
    }

    static create<M extends RedisModules, S extends RedisLuaScripts>(executor: RedisMultiExecutor, modules?: M, scripts?: S): RedisMultiCommandType<M, S> {
        return <any>new RedisMultiCommand<M, S>(executor, modules, scripts);
    }

    readonly #executor: RedisMultiExecutor;

    readonly #queue: Array<MultiQueuedCommand> = [];

    readonly #scriptsInUse = new Set<string>();

    constructor(executor: RedisMultiExecutor, modules?: RedisModules, scripts?: RedisLuaScripts) {
        this.#executor = executor;
        this.#initiateModules(modules);
        this.#initiateScripts(scripts);
    }

    #initiateModules(modules?: RedisModules): void {
        if (!modules) return;

        for (const m of modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisMultiCommand.defineCommand(this, name, command);
            }
        }
    }

    #initiateScripts(scripts?: RedisLuaScripts): void {
        if (!scripts) return;

        for (const [name, script] of Object.entries(scripts)) {
            RedisMultiCommand.defineLuaScript(this, name, script);
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
        if (!this.#queue.length) {
            return [];
        }

        const queue = this.#queue.splice(0);
        queue.unshift({
            encodedCommand: RedisCommandsQueue.encodeCommand(['MULTI'])
        });
        queue.push({
            encodedCommand: RedisCommandsQueue.encodeCommand(['EXEC'])
        });

        const rawReplies = await this.#executor(queue, Symbol('[RedisMultiCommand] Chain ID'));
        return rawReplies.map((reply, i) => {
            const { transformReply } = queue[i + 1];
            return transformReply ? transformReply(reply) : reply;
        });
    };
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisMultiCommand.defineCommand(RedisMultiCommand.prototype, name, command);
}
