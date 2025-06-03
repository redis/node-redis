import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

interface CommonOptions {
  REDIRECT?: number;
  NOLOOP?: boolean;
}

interface BroadcastOptions {
  BCAST?: boolean;
  PREFIX?: RedisVariadicArgument;
}

interface OptInOptions {
  OPTIN?: boolean;
}

interface OptOutOptions {
  OPTOUT?: boolean;
}

export type ClientTrackingOptions = CommonOptions & (
  BroadcastOptions |
  OptInOptions |
  OptOutOptions
);

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Controls server-assisted client side caching for the current connection
   * @param parser - The Redis command parser
   * @param mode - Whether to enable (true) or disable (false) tracking
   * @param options - Optional configuration including REDIRECT, BCAST, PREFIX, OPTIN, OPTOUT, and NOLOOP options
   */
  parseCommand<M extends boolean>(
    parser: CommandParser,
    mode: M,
    options?: M extends true ? ClientTrackingOptions : never
  ) {
    parser.push(
      'CLIENT',
      'TRACKING',
      mode ? 'ON' : 'OFF'
    );

    if (mode) {
      if (options?.REDIRECT) {
        parser.push(
          'REDIRECT',
          options.REDIRECT.toString()
        );
      }

      if (isBroadcast(options)) {
        parser.push('BCAST');

        if (options?.PREFIX) {
          if (Array.isArray(options.PREFIX)) {
            for (const prefix of options.PREFIX) {
              parser.push('PREFIX', prefix);
            }
          } else {
            parser.push('PREFIX', options.PREFIX);
          }
        }
      } else if (isOptIn(options)) {
        parser.push('OPTIN');
      } else if (isOptOut(options)) {
        parser.push('OPTOUT');
      }

      if (options?.NOLOOP) {
        parser.push('NOLOOP');
      }
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

function isBroadcast(options?: ClientTrackingOptions): options is BroadcastOptions {
  return (options as BroadcastOptions)?.BCAST === true;
}

function isOptIn(options?: ClientTrackingOptions): options is OptInOptions {
  return (options as OptInOptions)?.OPTIN === true;
}

function isOptOut(options?: ClientTrackingOptions): options is OptOutOptions {
  return (options as OptOutOptions)?.OPTOUT === true;
}
