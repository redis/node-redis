import COMMANDS from '../commands';
import RedisMultiCommand, { MULTI_REPLY, MultiReply, MultiReplyType } from '../multi-command';
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

export default class RedisClientMultiCommand<REPLIES = []> {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: RedisClientMultiCommand, ...args: Array<unknown>) {
      return this._multi.addCommand(
        command.transformArguments(...args),
        transformReply
      );
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: { self: RedisClientMultiCommand }, ...args: Array<unknown>) {
      return this.self._multi.addCommand(
        command.transformArguments(...args),
        transformReply
      );
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return function (this: { self: RedisClientMultiCommand }, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        redisArgs: CommandArguments = prefix.concat(fnArgs);
      redisArgs.preserve = fnArgs.preserve;
      return this.self._multi.addCommand(
        redisArgs,
        transformReply
      );
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const transformReply = getTransformReply(script, resp);
    return function (this: RedisClientMultiCommand, ...args: Array<unknown>) {
      this._multi.addScript(
        script,
        script.transformArguments(...args),
        transformReply
      );
      return this;
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
      createCommand: RedisClientMultiCommand._createCommand,
      createModuleCommand: RedisClientMultiCommand._createModuleCommand,
      createFunctionCommand: RedisClientMultiCommand._createFunctionCommand,
      createScriptCommand: RedisClientMultiCommand._createScriptCommand,
      config
    });
  }

  private readonly _multi = new RedisMultiCommand();
  private readonly _client: RedisClientType;
  private _selectedDB?: number;

  constructor(client: RedisClientType) {
    this._client = client;
  }

  SELECT(db: number, transformReply?: TransformReply): this {
    this._selectedDB = db;
    this._multi.addCommand(['SELECT', db.toString()], transformReply);
    return this;
  }

  select = this.SELECT;

  async exec<T extends MultiReply = MULTI_REPLY['GENERIC']>(execAsPipeline = false): Promise<MultiReplyType<T, REPLIES>> {
    if (execAsPipeline) return this.execAsPipeline<T>();

    return this._multi.transformReplies(
      await this._client.executeMulti(this._multi.queue, this._selectedDB)
    ) as MultiReplyType<T, REPLIES>;
  }

  EXEC = this.exec;

  execTyped(execAsPipeline = false) {
    return this.exec<MULTI_REPLY['TYPED']>(execAsPipeline);
  }

  async execAsPipeline<T extends MultiReply = MULTI_REPLY['GENERIC']>(): Promise<MultiReplyType<T, REPLIES>> {
    if (this._multi.queue.length === 0) return [] as MultiReplyType<T, REPLIES>;

    return this._multi.transformReplies(
      await this._client.executePipeline(this._multi.queue)
    ) as MultiReplyType<T, REPLIES>;
  }

  execAsPipelineTyped() {
    return this.execAsPipeline<MULTI_REPLY['TYPED']>();
  }
}
