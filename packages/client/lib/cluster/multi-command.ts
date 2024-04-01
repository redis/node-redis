import COMMANDS from "./commands";
import {
  ValkeyCommand,
  ValkeyCommandArgument,
  ValkeyCommandArguments,
  ValkeyCommandRawReply,
  ValkeyFunctions,
  ValkeyModules,
  ValkeyExtensions,
  ValkeyScript,
  ValkeyScripts,
  ExcludeMappedString,
  ValkeyFunction,
} from "../commands";
import ValkeyMultiCommand, { ValkeyMultiQueuedCommand } from "../multi-command";
import { attachCommands, attachExtensions } from "../commander";
import ValkeyCluster from ".";

type ValkeyClusterMultiCommandSignature<
  C extends ValkeyCommand,
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = (
  ...args: Parameters<C["transformArguments"]>
) => ValkeyClusterMultiCommandType<M, F, S>;

type WithCommands<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof typeof COMMANDS]: ValkeyClusterMultiCommandSignature<
    (typeof COMMANDS)[P],
    M,
    F,
    S
  >;
};

type WithModules<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof M as ExcludeMappedString<P>]: {
    [C in keyof M[P] as ExcludeMappedString<C>]: ValkeyClusterMultiCommandSignature<
      M[P][C],
      M,
      F,
      S
    >;
  };
};

type WithFunctions<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof F as ExcludeMappedString<P>]: {
    [FF in keyof F[P] as ExcludeMappedString<FF>]: ValkeyClusterMultiCommandSignature<
      F[P][FF],
      M,
      F,
      S
    >;
  };
};

type WithScripts<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof S as ExcludeMappedString<P>]: ValkeyClusterMultiCommandSignature<
    S[P],
    M,
    F,
    S
  >;
};

export type ValkeyClusterMultiCommandType<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = ValkeyClusterMultiCommand &
  WithCommands<M, F, S> &
  WithModules<M, F, S> &
  WithFunctions<M, F, S> &
  WithScripts<M, F, S>;

export type InstantiableValkeyClusterMultiCommandType<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = new (
  ...args: ConstructorParameters<typeof ValkeyClusterMultiCommand>
) => ValkeyClusterMultiCommandType<M, F, S>;

export type ValkeyClusterMultiExecutor = (
  queue: Array<ValkeyMultiQueuedCommand>,
  firstKey?: ValkeyCommandArgument,
  chainId?: symbol
) => Promise<Array<ValkeyCommandRawReply>>;

export default class ValkeyClusterMultiCommand {
  readonly #multi = new ValkeyMultiCommand();
  readonly #executor: ValkeyClusterMultiExecutor;
  #firstKey: ValkeyCommandArgument | undefined;

  static extend<
    M extends ValkeyModules,
    F extends ValkeyFunctions,
    S extends ValkeyScripts
  >(
    extensions?: ValkeyExtensions<M, F, S>
  ): InstantiableValkeyClusterMultiCommandType<M, F, S> {
    return attachExtensions({
      BaseClass: ValkeyClusterMultiCommand,
      modulesExecutor: ValkeyClusterMultiCommand.prototype.commandsExecutor,
      modules: extensions?.modules,
      functionsExecutor: ValkeyClusterMultiCommand.prototype.functionsExecutor,
      functions: extensions?.functions,
      scriptsExecutor: ValkeyClusterMultiCommand.prototype.scriptsExecutor,
      scripts: extensions?.scripts,
    });
  }

  constructor(
    executor: ValkeyClusterMultiExecutor,
    firstKey?: ValkeyCommandArgument
  ) {
    this.#executor = executor;
    this.#firstKey = firstKey;
  }

  commandsExecutor(command: ValkeyCommand, args: Array<unknown>): this {
    const transformedArguments = command.transformArguments(...args);
    this.#firstKey ??= ValkeyCluster.extractFirstKey(
      command,
      args,
      transformedArguments
    );
    return this.addCommand(
      undefined,
      transformedArguments,
      command.transformReply
    );
  }

  addCommand(
    firstKey: ValkeyCommandArgument | undefined,
    args: ValkeyCommandArguments,
    transformReply?: ValkeyCommand["transformReply"]
  ): this {
    this.#firstKey ??= firstKey;
    this.#multi.addCommand(args, transformReply);
    return this;
  }

  functionsExecutor(
    fn: ValkeyFunction,
    args: Array<unknown>,
    name: string
  ): this {
    const transformedArguments = this.#multi.addFunction(name, fn, args);
    this.#firstKey ??= ValkeyCluster.extractFirstKey(
      fn,
      args,
      transformedArguments
    );
    return this;
  }

  scriptsExecutor(script: ValkeyScript, args: Array<unknown>): this {
    const transformedArguments = this.#multi.addScript(script, args);
    this.#firstKey ??= ValkeyCluster.extractFirstKey(
      script,
      args,
      transformedArguments
    );
    return this;
  }

  async exec(execAsPipeline = false): Promise<Array<ValkeyCommandRawReply>> {
    if (execAsPipeline) {
      return this.execAsPipeline();
    }

    return this.#multi.handleExecReplies(
      await this.#executor(
        this.#multi.queue,
        this.#firstKey,
        ValkeyMultiCommand.generateChainId()
      )
    );
  }

  EXEC = this.exec;

  async execAsPipeline(): Promise<Array<ValkeyCommandRawReply>> {
    return this.#multi.transformReplies(
      await this.#executor(this.#multi.queue, this.#firstKey)
    );
  }
}

attachCommands({
  BaseClass: ValkeyClusterMultiCommand,
  commands: COMMANDS,
  executor: ValkeyClusterMultiCommand.prototype.commandsExecutor,
});
