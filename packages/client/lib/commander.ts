
import { ClientCommandOptions } from './client';
import { CommandOptions, isCommandOptions } from './command-options';
import { RedisCommand, RedisCommandArgument, RedisCommandArguments, RedisCommandReply, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts } from './commands';

type Instantiable<T = any> = new (...args: Array<any>) => T;

type CommandsExecutor<C extends RedisCommand = RedisCommand> =
    (command: C, args: Array<unknown>, name: string) => unknown;

interface AttachCommandsConfig<C extends RedisCommand> {
    BaseClass: Instantiable;
    commands: Record<string, C>;
    executor: CommandsExecutor<C>;
}

export function attachCommands<C extends RedisCommand>({
    BaseClass,
    commands,
    executor
}: AttachCommandsConfig<C>): void {
    for (const [name, command] of Object.entries(commands)) {
        BaseClass.prototype[name] = function (...args: Array<unknown>): unknown {
            return executor.call(this, command, args, name);
        };
    }
}

interface AttachExtensionsConfig<T extends Instantiable = Instantiable> {
    BaseClass: T;
    modulesExecutor: CommandsExecutor;
    modules?: RedisModules;
    functionsExecutor: CommandsExecutor<RedisFunction>;
    functions?: RedisFunctions;
    scriptsExecutor: CommandsExecutor<RedisScript>;
    scripts?: RedisScripts;
}

export function attachExtensions(config: AttachExtensionsConfig): any {
    let Commander;

    if (config.modules) {
        Commander = attachWithNamespaces({
            BaseClass: config.BaseClass,
            namespaces: config.modules,
            executor: config.modulesExecutor
        });
    }

    if (config.functions) {
        Commander = attachWithNamespaces({
            BaseClass: Commander ?? config.BaseClass,
            namespaces: config.functions,
            executor: config.functionsExecutor
        });
    }

    if (config.scripts) {
        Commander ??= class extends config.BaseClass {};
        attachCommands({
            BaseClass: Commander,
            commands: config.scripts,
            executor: config.scriptsExecutor
        });
    }

    return Commander ?? config.BaseClass;
}

interface AttachWithNamespacesConfig<C extends RedisCommand> {
    BaseClass: Instantiable;
    namespaces: Record<string, Record<string, C>>;
    executor: CommandsExecutor<C>;
}

function attachWithNamespaces<C extends RedisCommand>({
    BaseClass,
    namespaces,
    executor
}: AttachWithNamespacesConfig<C>): any {
    const Commander = class extends BaseClass {
        constructor(...args: Array<any>) {
            super(...args);

            for (const namespace of Object.keys(namespaces)) {
                this[namespace] = Object.create(this[namespace], {
                    self: {
                        value: this
                    }
                });
            }
        }
    };

    for (const [namespace, commands] of Object.entries(namespaces)) {
        Commander.prototype[namespace] = {};
        for (const [name, command] of Object.entries(commands)) {
            Commander.prototype[namespace][name] = function (...args: Array<unknown>): unknown {
                return executor.call(this.self, command, args, name);
            };
        }
    }

    return Commander;
}

export function transformCommandArguments<T = ClientCommandOptions>(
    command: RedisCommand,
    args: Array<unknown>
): {
    jsArgs: Array<unknown>;
    args: RedisCommandArguments;
    options: CommandOptions<T> | undefined;
} {
    let options;
    if (isCommandOptions<T>(args[0])) {
        options = args[0];
        args = args.slice(1);
    }

    return {
        jsArgs: args,
        args: command.transformArguments(...args),
        options
    };
}

export function transformLegacyCommandArguments(args: Array<any>): Array<any> {
    return args.flat().map(arg => {
        return typeof arg === 'number' || arg instanceof Date ?
            arg.toString() :
            arg;
    });
}

export function transformCommandReply<C extends RedisCommand>(
    command: C,
    rawReply: unknown,
    preserved: unknown
): RedisCommandReply<C> {
    if (!command.transformReply) {
        return rawReply as RedisCommandReply<C>;
    }

    return command.transformReply(rawReply, preserved);
}

export function fCallArguments(
    name: RedisCommandArgument,
    fn: RedisFunction,
    args: RedisCommandArguments
): RedisCommandArguments {
    const actualArgs: RedisCommandArguments = [
        fn.IS_READ_ONLY ? 'FCALL_RO' : 'FCALL',
        name
    ];

    if (fn.NUMBER_OF_KEYS !== undefined) {
        actualArgs.push(fn.NUMBER_OF_KEYS.toString());
    }

    actualArgs.push(...args);

    return actualArgs;
}
