import COMMANDS from '../commands';
import RedisMultiCommand, { RedisMultiQueuedCommand } from '../multi-command';
import { ReplyWithFlags, CommandReply, Command, CommandArguments, CommanderConfig, RedisFunctions, RedisModules, RedisScripts, RespVersions, TransformReply, RedisScript, RedisFunction, Flags, ReplyUnion } from '../RESP/types';
import { attachConfig, functionArgumentsPrefix, getTransformReply } from '../commander';
import { RedisClientType } from '.';

type CommandSignature<
  REPLIES extends Array<unknown>,
  C extends Command,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = (...args: Parameters<C['transformArguments']>) => RedisClientMultiCommandType<
  [...REPLIES, ReplyWithFlags<CommandReply<C, RESP>, FLAGS>],
  M,
  F,
  S,
  RESP,
  FLAGS
>;

type WithCommands<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
  [P in keyof typeof COMMANDS]: CommandSignature<REPLIES, (typeof COMMANDS)[P], M, F, S, RESP, FLAGS>;
};

type WithModules<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
  [P in keyof M]: {
    [C in keyof M[P]]: CommandSignature<REPLIES, M[P][C], M, F, S, RESP, FLAGS>;
  };
};

type WithFunctions<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
  [L in keyof F]: {
    [C in keyof F[L]]: CommandSignature<REPLIES, F[L][C], M, F, S, RESP, FLAGS>;
  };
};

type WithScripts<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
  [P in keyof S]: CommandSignature<REPLIES, S[P], M, F, S, RESP, FLAGS>;
};

export type RedisClientMultiCommandType<
  REPLIES extends Array<any>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = (
  RedisClientMultiCommand<REPLIES> &
  WithCommands<REPLIES, M, F, S, RESP, FLAGS> & 
  WithModules<REPLIES, M, F, S, RESP, FLAGS> &
  WithFunctions<REPLIES, M, F, S, RESP, FLAGS> &
  WithScripts<REPLIES, M, F, S, RESP, FLAGS>
);

type MULTI_REPLY = {
  GENERIC: 'generic';
  TYPED: 'typed';
};

type MultiReply = MULTI_REPLY[keyof MULTI_REPLY];

type ReplyType<T extends MultiReply, REPLIES> = T extends MULTI_REPLY['TYPED'] ? REPLIES : Array<unknown>;

export type RedisClientMultiExecutor = (
  queue: Array<RedisMultiQueuedCommand>,
  selectedDB?: number,
  chainId?: symbol
) => Promise<Array<unknown>>;

export default class RedisClientMultiCommand<REPLIES = []> extends RedisMultiCommand {
  static #createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: RedisClientMultiCommand) {
      return this.addCommand(
        command.transformArguments.apply(undefined, arguments as any),
        transformReply
      );
    };
  }

  static #createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: { self: RedisClientMultiCommand }) {
      return this.self.addCommand(
        command.transformArguments.apply(undefined, arguments as any),
        transformReply
      );
    };
  }

  static #createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return function (this: { self: RedisClientMultiCommand }) {
      const fnArgs = fn.transformArguments.apply(undefined, arguments as any),
        args: CommandArguments = prefix.concat(fnArgs);
      args.preserve = fnArgs.preserve;
      return this.self.addCommand(
        args,
        transformReply
      );
    };
  }

  static #createScriptCommand(script: RedisScript, resp: RespVersions) {
    const transformReply = getTransformReply(script, resp);
    return function (this: RedisClientMultiCommand) {
      return this.addScript(
        script,
        script.transformArguments.apply(undefined, arguments as any),
        transformReply
      );
    };
  }

  static extend<
    M extends RedisModules = Record<string, never>,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>,
    RESP extends RespVersions = 2
  >(config?: CommanderConfig<M, F, S, RESP>) {
    return attachConfig({
      BaseClass: RedisClientMultiCommand,
      commands: COMMANDS,
      createCommand: RedisClientMultiCommand.#createCommand,
      createModuleCommand: RedisClientMultiCommand.#createModuleCommand,
      createFunctionCommand: RedisClientMultiCommand.#createFunctionCommand,
      createScriptCommand: RedisClientMultiCommand.#createScriptCommand,
      config
    });
  }

  readonly #client: RedisClientType;
  #selectedDB?: number;

  constructor(client: RedisClientType) {
    super();
    this.#client = client;
  }

  SELECT(db: number, transformReply?: TransformReply): this {
    this.#selectedDB = db;
    return this.addCommand(['SELECT', db.toString()], transformReply);
  }

  select = this.SELECT;

  async exec<T extends MultiReply = MULTI_REPLY['GENERIC']>(execAsPipeline = false): Promise<ReplyType<T, REPLIES>> {
    if (execAsPipeline) return this.execAsPipeline<T>();

    return this.transformReplies(
      await this.#client.executeMulti(this.queue, this.#selectedDB)
    ) as ReplyType<T, REPLIES>;
  }

  EXEC = this.exec;

  execTyped(execAsPipeline = false) {
    return this.exec<MULTI_REPLY['TYPED']>(execAsPipeline);
  }

  async execAsPipeline<T extends MultiReply = MULTI_REPLY['GENERIC']>(): Promise<ReplyType<T, REPLIES>> {
    if (this.queue.length === 0) return [] as ReplyType<T, REPLIES>;

    return this.transformReplies(
      await this.#client.executePipeline(this.queue)
    ) as ReplyType<T, REPLIES>;
  }

  execAsPipelineTyped() {
    return this.execAsPipeline<MULTI_REPLY['TYPED']>();
  }
}
