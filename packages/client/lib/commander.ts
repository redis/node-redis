import { ClientCommandOptions } from "./client";
import { CommandOptions, isCommandOptions } from "./command-options";
import {
  ValkeyCommand,
  ValkeyCommandArgument,
  ValkeyCommandArguments,
  ValkeyCommandReply,
  ValkeyFunction,
  ValkeyFunctions,
  ValkeyModules,
  ValkeyScript,
  ValkeyScripts,
} from "./commands";

type Instantiable<T = any> = new (...args: Array<any>) => T;

type CommandsExecutor<C extends ValkeyCommand = ValkeyCommand> = (
  command: C,
  args: Array<unknown>,
  name: string
) => unknown;

interface AttachCommandsConfig<C extends ValkeyCommand> {
  BaseClass: Instantiable;
  commands: Record<string, C>;
  executor: CommandsExecutor<C>;
}

export function attachCommands<C extends ValkeyCommand>({
  BaseClass,
  commands,
  executor,
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
  modules?: ValkeyModules;
  functionsExecutor: CommandsExecutor<ValkeyFunction>;
  functions?: ValkeyFunctions;
  scriptsExecutor: CommandsExecutor<ValkeyScript>;
  scripts?: ValkeyScripts;
}

export function attachExtensions(config: AttachExtensionsConfig): any {
  let Commander;

  if (config.modules) {
    Commander = attachWithNamespaces({
      BaseClass: config.BaseClass,
      namespaces: config.modules,
      executor: config.modulesExecutor,
    });
  }

  if (config.functions) {
    Commander = attachWithNamespaces({
      BaseClass: Commander ?? config.BaseClass,
      namespaces: config.functions,
      executor: config.functionsExecutor,
    });
  }

  if (config.scripts) {
    Commander ??= class extends config.BaseClass {};
    attachCommands({
      BaseClass: Commander,
      commands: config.scripts,
      executor: config.scriptsExecutor,
    });
  }

  return Commander ?? config.BaseClass;
}

interface AttachWithNamespacesConfig<C extends ValkeyCommand> {
  BaseClass: Instantiable;
  namespaces: Record<string, Record<string, C>>;
  executor: CommandsExecutor<C>;
}

function attachWithNamespaces<C extends ValkeyCommand>({
  BaseClass,
  namespaces,
  executor,
}: AttachWithNamespacesConfig<C>): any {
  const Commander = class extends BaseClass {
    constructor(...args: Array<any>) {
      super(...args);

      for (const namespace of Object.keys(namespaces)) {
        this[namespace] = Object.create(this[namespace], {
          self: {
            value: this,
          },
        });
      }
    }
  };

  for (const [namespace, commands] of Object.entries(namespaces)) {
    Commander.prototype[namespace] = {};
    for (const [name, command] of Object.entries(commands)) {
      Commander.prototype[namespace][name] = function (
        ...args: Array<unknown>
      ): unknown {
        return executor.call(this.self, command, args, name);
      };
    }
  }

  return Commander;
}

export function transformCommandArguments<T = ClientCommandOptions>(
  command: ValkeyCommand,
  args: Array<unknown>
): {
  jsArgs: Array<unknown>;
  args: ValkeyCommandArguments;
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
    options,
  };
}

export function transformLegacyCommandArguments(args: Array<any>): Array<any> {
  return args.flat().map((arg) => {
    return typeof arg === "number" || arg instanceof Date
      ? arg.toString()
      : arg;
  });
}

export function transformCommandReply<C extends ValkeyCommand>(
  command: C,
  rawReply: unknown,
  preserved: unknown
): ValkeyCommandReply<C> {
  if (!command.transformReply) {
    return rawReply as ValkeyCommandReply<C>;
  }

  return command.transformReply(rawReply, preserved);
}

export function fCallArguments(
  name: ValkeyCommandArgument,
  fn: ValkeyFunction,
  args: ValkeyCommandArguments
): ValkeyCommandArguments {
  const actualArgs: ValkeyCommandArguments = [
    fn.IS_READ_ONLY ? "FCALL_RO" : "FCALL",
    name,
  ];

  if (fn.NUMBER_OF_KEYS !== undefined) {
    actualArgs.push(fn.NUMBER_OF_KEYS.toString());
  }

  actualArgs.push(...args);

  return actualArgs;
}
