import COMMANDS from './commands';
import { RedisCommand, RedisModules } from './commands';
import { ClientCommandOptions, RedisClientType, WithPlugins } from './client';
import { RedisSocketOptions } from './socket';
import RedisClusterSlots from './cluster-slots';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';
import { commandOptions, CommandOptions, isCommandOptions } from './command-options';

export interface RedisClusterOptions<M = RedisModules, S = RedisLuaScripts> {
    rootNodes: Array<RedisSocketOptions>;
    modules?: M;
    scripts?: S;
    useReplicas?: boolean;
    maxCommandRedirections?: number;
}

export type RedisClusterType<M extends RedisModules, S extends RedisLuaScripts> =
    WithPlugins<M, S> & RedisCluster;

export default class RedisCluster<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> {
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = async function (...args: Array<unknown>): Promise<unknown> {
            const options = isCommandOptions(args[0]) && args[0];
            return command.transformReply(
                await this.sendCommand(
                    command,
                    command.transformArguments(...(options ? args.slice(1) : args)),
                    options
                )
            );
        };
    }

    static create<M extends RedisModules, S extends RedisLuaScripts>(options: RedisClusterOptions): RedisClusterType<M, S> {
        return <any>new RedisCluster(options);
    }

    static commandOptions(options: ClientCommandOptions): CommandOptions<ClientCommandOptions> {
        return commandOptions(options);
    }

    readonly #options: RedisClusterOptions;
    readonly #slots: RedisClusterSlots<M, S>;

    constructor(options: RedisClusterOptions<M, S>) {
        this.#options = options;
        this.#slots = new RedisClusterSlots(options);
        this.#initiateModules();
        this.#initiateScripts();
    }

    #initiateModules(): void {
        if (!this.#options.modules) return;

        for (const m of this.#options.modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisCluster.defineCommand(this, name, command);
            }
        }
    }

    #initiateScripts(): void {
        if (!this.#options.scripts) return;

        for (const [name, script] of Object.entries(this.#options.scripts)) {
            (this as any)[name] = async function (...args: Parameters<typeof script.transformArguments>): Promise<ReturnType<typeof script.transformReply>> {
                const options = isCommandOptions(args[0]) && args[0];
                return script.transformReply(
                    await this.executeScript(
                        script, 
                        script.transformArguments(...(options ? args.slice(1) : args)),
                        options
                    )
                );
            };
        }
    }

    async connect(): Promise<void> {
        return this.#slots.connect();
    }

    async sendCommand<C extends RedisCommand>(command: C, args: Array<string>, options?: ClientCommandOptions, redirections: number = 0): Promise<ReturnType<C['transformReply']>> {
        const client = this.#getClient(command, args);

        try {
            return await client.sendCommand(args, options);
        } catch (err) {
            if (await this.#handleCommandError(err, client, redirections)) {
                return this.sendCommand(command, args, options, redirections + 1);
            }

            throw err;
        }
    }

    async executeScript<S extends RedisLuaScript>(script: S, args: Array<string>, options?: ClientCommandOptions, redirections: number = 0): Promise<ReturnType<S['transformReply']>> {
        const client = this.#getClient(script, args);

        try {
            return await client.executeScript(script, args, options);
        } catch (err) {
            if (await this.#handleCommandError(err, client, redirections)) {
                return this.executeScript(script, args, options, redirections + 1);
            }

            throw err;
        }
    }

    #getClient(commandOrScript: RedisCommand | RedisLuaScript, args: Array<string>): RedisClientType<M, S> {
        return this.#slots.getClient(
            commandOrScript.FIRST_KEY_INDEX ? args[commandOrScript.FIRST_KEY_INDEX] : undefined,
            commandOrScript.IS_READ_ONLY
        );
    }

    async #handleCommandError(err: Error, client: RedisClientType<M, S>, redirections: number = 0): Promise<boolean> {
        if (redirections < (this.#options.maxCommandRedirections ?? 16)) {
            throw err;
        }

        if (err.message.startsWith('ASK')) {
            // TODO
        } else if (err.message.startsWith('MOVED')) {
            await this.#slots.discover(client);
        }

        throw err;
    }

    getMasters(): Array<RedisClientType<M, S>> {
        return this.#slots.getMasters();
    }

    disconnect(): Promise<void> {
        return this.#slots.disconnect();
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisCluster.defineCommand(RedisCluster.prototype, name, command);
}
