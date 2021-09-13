
import COMMANDS, { RedisCommand, RedisModules, TransformArgumentsReply } from './commands';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';
import { CommandOptions, isCommandOptions } from './command-options';
import { off } from 'process';

type Instantiable<T = any> = new(...args: Array<any>) => T;

type CommandExecutor<T extends Instantiable = Instantiable> = (this: InstanceType<T>, command: RedisCommand, args: Array<unknown>) => unknown;

export function extendWithDefaultCommands<T extends Instantiable>(BaseClass: T, executor: CommandExecutor<T>): void {
    for (const [name, command] of Object.entries(COMMANDS)) {
        BaseClass.prototype[name] = function (...args: Array<unknown>): unknown {
            return executor.call(this, command, args);
        };
    }
}

interface ExtendWithModulesAndScriptsConfig<
    T extends Instantiable,
    M extends RedisModules,
    S extends RedisLuaScripts
> {
    BaseClass: T;
    modules: M | undefined;
    modulesCommandsExecutor: CommandExecutor<T>;
    scripts: S | undefined;
    scriptsExecutor(this: InstanceType<T>, script: RedisLuaScript, args: Array<unknown>): unknown;
}

export function extendWithModulesAndScripts<
    T extends Instantiable,
    M extends RedisModules,
    S extends RedisLuaScripts,
>(config: ExtendWithModulesAndScriptsConfig<T, M, S>): T {
    let Commander: T | undefined;

    if (config.modules) {
        Commander = class extends config.BaseClass {
            constructor(...args: Array<any>) {
                super(...args);

                for (const module of Object.keys(config.modules as RedisModules)) {
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
    args: TransformArgumentsReply;
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

export function* encodeCommand(args: TransformArgumentsReply): IterableIterator<string | Buffer> {
    yield `*${args.length}${DELIMITER}`;

    for (const arg of args) {
        const byteLength = typeof arg === 'string' ? Buffer.byteLength(arg): arg.length;
        yield `$${byteLength.toString()}${DELIMITER}`;
        yield arg;
        yield DELIMITER;
    }
}
