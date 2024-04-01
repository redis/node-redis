import COMMANDS from "./commands";
import {
  ValkeyCommand,
  ValkeyCommandArguments,
  ValkeyCommandRawReply,
  ValkeyFunctions,
  ValkeyModules,
  ValkeyExtensions,
  ValkeyScript,
  ValkeyScripts,
  ExcludeMappedString,
  ValkeyFunction,
  ValkeyCommands,
} from "../commands";
import ValkeyMultiCommand, { ValkeyMultiQueuedCommand } from "../multi-command";
import {
  attachCommands,
  attachExtensions,
  transformLegacyCommandArguments,
} from "../commander";

type CommandSignature<
  C extends ValkeyCommand,
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = (
  ...args: Parameters<C["transformArguments"]>
) => ValkeyClientMultiCommandType<M, F, S>;

type WithCommands<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], M, F, S>;
};

type WithModules<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = {
  [P in keyof M as ExcludeMappedString<P>]: {
    [C in keyof M[P] as ExcludeMappedString<C>]: CommandSignature<
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
    [FF in keyof F[P] as ExcludeMappedString<FF>]: CommandSignature<
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
  [P in keyof S as ExcludeMappedString<P>]: CommandSignature<S[P], M, F, S>;
};

export type ValkeyClientMultiCommandType<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = ValkeyClientMultiCommand &
  WithCommands<M, F, S> &
  WithModules<M, F, S> &
  WithFunctions<M, F, S> &
  WithScripts<M, F, S>;

type InstantiableValkeyMultiCommand<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> = new (
  ...args: ConstructorParameters<typeof ValkeyClientMultiCommand>
) => ValkeyClientMultiCommandType<M, F, S>;

export type ValkeyClientMultiExecutor = (
  queue: Array<ValkeyMultiQueuedCommand>,
  selectedDB?: number,
  chainId?: symbol
) => Promise<Array<ValkeyCommandRawReply>>;

export default class ValkeyClientMultiCommand {
  static extend<
    M extends ValkeyModules,
    F extends ValkeyFunctions,
    S extends ValkeyScripts
  >(
    extensions?: ValkeyExtensions<M, F, S>
  ): InstantiableValkeyMultiCommand<M, F, S> {
    return attachExtensions({
      BaseClass: ValkeyClientMultiCommand,
      modulesExecutor: ValkeyClientMultiCommand.prototype.commandsExecutor,
      modules: extensions?.modules,
      functionsExecutor: ValkeyClientMultiCommand.prototype.functionsExecutor,
      functions: extensions?.functions,
      scriptsExecutor: ValkeyClientMultiCommand.prototype.scriptsExecutor,
      scripts: extensions?.scripts,
    });
  }

  readonly #multi = new ValkeyMultiCommand();
  readonly #executor: ValkeyClientMultiExecutor;
  readonly v4: Record<string, any> = {};
  #selectedDB?: number;

  constructor(executor: ValkeyClientMultiExecutor, legacyMode = false) {
    this.#executor = executor;
    if (legacyMode) {
      this.#legacyMode();
    }
  }

  #legacyMode(): void {
    this.v4.addCommand = this.addCommand.bind(this);
    (this as any).addCommand = (...args: Array<any>): this => {
      this.#multi.addCommand(transformLegacyCommandArguments(args));
      return this;
    };
    this.v4.exec = this.exec.bind(this);
    (this as any).exec = (
      callback?: (err: Error | null, replies?: Array<unknown>) => unknown
    ): void => {
      this.v4
        .exec()
        .then((reply: Array<unknown>) => {
          if (!callback) return;

          callback(null, reply);
        })
        .catch((err: Error) => {
          if (!callback) {
            // this.emit('error', err);
            return;
          }

          callback(err);
        });
    };

    for (const [name, command] of Object.entries(COMMANDS as ValkeyCommands)) {
      this.#defineLegacyCommand(name, command);
      (this as any)[name.toLowerCase()] ??= (this as any)[name];
    }
  }

  #defineLegacyCommand(this: any, name: string, command?: ValkeyCommand): void {
    this.v4[name] = this[name].bind(this.v4);
    this[name] =
      command && command.TRANSFORM_LEGACY_REPLY && command.transformReply
        ? (...args: Array<unknown>) => {
            this.#multi.addCommand(
              [name, ...transformLegacyCommandArguments(args)],
              command.transformReply
            );
            return this;
          }
        : (...args: Array<unknown>) => this.addCommand(name, ...args);
  }

  commandsExecutor(command: ValkeyCommand, args: Array<unknown>): this {
    return this.addCommand(
      command.transformArguments(...args),
      command.transformReply
    );
  }

  SELECT(db: number, transformReply?: ValkeyCommand["transformReply"]): this {
    this.#selectedDB = db;
    return this.addCommand(["SELECT", db.toString()], transformReply);
  }

  select = this.SELECT;

  addCommand(
    args: ValkeyCommandArguments,
    transformReply?: ValkeyCommand["transformReply"]
  ): this {
    this.#multi.addCommand(args, transformReply);
    return this;
  }

  functionsExecutor(
    fn: ValkeyFunction,
    args: Array<unknown>,
    name: string
  ): this {
    this.#multi.addFunction(name, fn, args);
    return this;
  }

  scriptsExecutor(script: ValkeyScript, args: Array<unknown>): this {
    this.#multi.addScript(script, args);
    return this;
  }

  async exec(execAsPipeline = false): Promise<Array<ValkeyCommandRawReply>> {
    if (execAsPipeline) {
      return this.execAsPipeline();
    }

    return this.#multi.handleExecReplies(
      await this.#executor(
        this.#multi.queue,
        this.#selectedDB,
        ValkeyMultiCommand.generateChainId()
      )
    );
  }

  EXEC = this.exec;

  async execAsPipeline(): Promise<Array<ValkeyCommandRawReply>> {
    if (this.#multi.queue.length === 0) return [];

    return this.#multi.transformReplies(
      await this.#executor(this.#multi.queue, this.#selectedDB)
    );
  }
}

attachCommands({
  BaseClass: ValkeyClientMultiCommand,
  commands: COMMANDS,
  executor: ValkeyClientMultiCommand.prototype.commandsExecutor,
});
