import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
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
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand<M extends boolean>(
    parser: CommandParser,
    mode: M,
    options?: M extends true ? ClientTrackingOptions : never
  ) {
    parser.pushVariadic(
      [
        'CLIENT',
        'TRACKING',
        mode ? 'ON' : 'OFF'
      ]
    );

    if (mode) {
      if (options?.REDIRECT) {
        parser.pushVariadic(
          [
            'REDIRECT',
            options.REDIRECT.toString()
          ]
        );
      }

      if (isBroadcast(options)) {
        parser.push('BCAST');

        if (options?.PREFIX) {
          if (Array.isArray(options.PREFIX)) {
            for (const prefix of options.PREFIX) {
              parser.pushVariadic(['PREFIX', prefix]);
            }
          } else {
            parser.pushVariadic(['PREFIX', options.PREFIX]);
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
  transformArguments<M extends boolean>(
    mode: M,
    options?: M extends true ? ClientTrackingOptions : never
  ) { return [] },
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
