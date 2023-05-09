import { RedisModules, RedisFunctions, RedisScripts, RespVersions, Flags, Command, CommandArguments, ReplyUnion } from '../RESP/types';
import { RedisClientType } from '.';
import { getTransformReply } from '../commander';
import { ErrorReply } from '../errors';
import COMMANDS from '../commands';

type LegacyArgument = string | Buffer | number | Date;

type LegacyArguments = Array<LegacyArgument | LegacyArguments>;

type LegacyCallback = (err: ErrorReply | null, reply?: ReplyUnion) => unknown

type LegacyCommandArguments = LegacyArguments | [
  ...args: LegacyArguments,
  callback: LegacyCallback
];

export type CommandSignature = (...args: LegacyCommandArguments) => void;

type WithCommands = {
  [P in keyof typeof COMMANDS]: CommandSignature;
};

export type RedisLegacyClientType = RedisLegacyClient & WithCommands;

export class RedisLegacyClient {
  private static _transformArguments(redisArgs: CommandArguments, args: LegacyCommandArguments) {
    let callback: LegacyCallback | undefined;
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop() as LegacyCallback;
    }

    RedisLegacyClient._pushArguments(redisArgs, args as LegacyArguments);

    return callback;
  }

  private static _pushArguments(redisArgs: CommandArguments, args: LegacyArguments) {
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (Array.isArray(arg)) {
        RedisLegacyClient._pushArguments(redisArgs, arg);
      } else {
        redisArgs.push(
          typeof arg === 'number' || arg instanceof Date ?
            arg.toString() :
            arg
        );
      }
    }
  }

  private static _getTransformReply(command: Command, resp: RespVersions) {
    return command.TRANSFORM_LEGACY_REPLY ?
      getTransformReply(command, resp) :
      undefined;
  }

  private static _createCommand(name: string, command: Command, resp: RespVersions) {
    const transformReply = RedisLegacyClient._getTransformReply(command, resp);
    return async function (this: RedisLegacyClient, ...args: LegacyCommandArguments) {
      const redisArgs = [name],
        callback = RedisLegacyClient._transformArguments(redisArgs, args),
        promise = this._client.sendCommand(redisArgs);

      if (!callback) {
        promise.catch(err => this._client.emit('error', err));
        return;
      }

      promise
        .then(reply => callback(null, transformReply ? transformReply(reply) : reply))
        .catch(err => callback(err));
    };
  }

  constructor(
    private _client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  ) {
    const RESP = _client.options?.RESP ?? 2;
    for (const [name, command] of Object.entries(COMMANDS)) {
      // TODO: as any?
      (this as any)[name] = RedisLegacyClient._createCommand(
        name,
        command,
        RESP
      );
    }

    // TODO: Multi
  }

  sendCommand(...args: LegacyArguments) {
    const redisArgs: CommandArguments = [],
      callback = RedisLegacyClient._transformArguments(redisArgs, args),
      promise = this._client.sendCommand(redisArgs);

    if (!callback) {
      promise.catch(err => this._client.emit('error', err));
      return;
    }
  
    promise
      .then(reply => callback(null, reply))
      .catch(err => callback(err));
  }
}
