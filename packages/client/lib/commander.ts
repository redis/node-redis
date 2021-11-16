
import { CommandOptions, isCommandOptions } from './command-options';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisCommandReply, RedisCommands, RedisModules, RedisScript, RedisScripts } from './commands';

type Instantiable<T = any> = new(...args: Array<any>) => T;

interface ExtendWithCommandsConfig<T extends Instantiable> {
    BaseClass: T;
    commands: RedisCommands;
    executor(command: RedisCommand, args: Array<unknown>): unknown;
}

export function extendWithCommands<T extends Instantiable>({ BaseClass, commands, executor }: ExtendWithCommandsConfig<T>): void {
    for (const [name, command] of Object.entries(commands)) {
        BaseClass.prototype[name] = function (...args: Array<unknown>): unknown {
            return executor.call(this, command, args);
        };
    }
}

interface ExtendWithModulesAndScriptsConfig<T extends Instantiable> {
    BaseClass: T;
    modules?: RedisModules;
    modulesCommandsExecutor(this: InstanceType<T>, command: RedisCommand, args: Array<unknown>): unknown;
    scripts?: RedisScripts;
    scriptsExecutor(this: InstanceType<T>, script: RedisScript, args: Array<unknown>): unknown;
}

export function extendWithModulesAndScripts<T extends Instantiable>(config: ExtendWithModulesAndScriptsConfig<T>): T {
    let Commander: T | undefined;

    if (config.modules) {
        Commander = class extends config.BaseClass {
            constructor(...args: Array<any>) {
                super(...args);

                for (const module of Object.keys(config.modules!)) {
                    this[module] = new this[module](this);
                }
            }
        };

        for (const [moduleName, module] of Object.entries(config.modules)) {
            Commander.prototype[moduleName] = class {
                readonly self: T;

                constructor(self: InstanceType<T>) {
                    this.self = self;
                }
            };

            for (const [commandName, command] of Object.entries(module)) {
                Commander.prototype[moduleName].prototype[commandName] = function (...args: Array<unknown>): unknown {
                    return config.modulesCommandsExecutor.call(this.self, command, args);
                };
            }
        }
    }

    if (config.scripts) {
        Commander ??= class extends config.BaseClass {};

        for (const [name, script] of Object.entries(config.scripts)) {
            Commander.prototype[name] = function (...args: Array<unknown>): unknown {
                return config.scriptsExecutor.call(this, script, args);
            };
        }
    }

    return (Commander ?? config.BaseClass) as any;
}

export function transformCommandArguments<T = unknown>(
    command: RedisCommand,
    args: Array<unknown>
): {
    args: RedisCommandArguments;
    options: CommandOptions<T> | undefined;
} {
    let options;
    if (isCommandOptions<T>(args[0])) {
        options = args[0];
        args = args.slice(1);
    }

    return {
        args: command.transformArguments(...args),
        options
    };
}

const DELIMITER = '\r\n';

export function* encodeCommand(args: RedisCommandArguments): IterableIterator<string | Buffer> {
    yield `*${args.length}${DELIMITER}`;

    for (const arg of args) {
        const byteLength = typeof arg === 'string' ? Buffer.byteLength(arg): arg.length;
        yield `$${byteLength.toString()}${DELIMITER}`;
        yield arg;
        yield DELIMITER;
    }
}

export function transformCommandReply(
    command: RedisCommand,
    rawReply: RedisCommandRawReply,
    preserved: unknown
): RedisCommandReply<typeof command> {
    if (!command.transformReply) {
        return rawReply;
    }

    return command.transformReply(rawReply, preserved);
}

export type LegacyCommandArguments = Array<string | number | Buffer | LegacyCommandArguments>;

export function transformLegacyCommandArguments(args: LegacyCommandArguments, flat: RedisCommandArguments = []): RedisCommandArguments {
    for (const arg of args) {
        if (Array.isArray(arg)) {
            transformLegacyCommandArguments(arg, flat);
            continue;
        }

        flat.push(typeof arg === 'number' ? arg.toString() : arg);
    }

    return flat;
}
