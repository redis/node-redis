import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformBooleanReply, transformDoubleArgument } from './generic-transformers';

export interface VAddOptions {
  REDUCE?: number;
  CAS?: boolean;
  QUANT?: 'NOQUANT' | 'BIN' | 'Q8',
  EF?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SETATTR?: RedisArgument | Record<string, any>;
  M?: number;
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    vector: Array<number>,
    element: RedisArgument,
    options?: VAddOptions
  ) {
    parser.push('VADD');
    parser.pushKey(key);

    if (options?.REDUCE !== undefined) {
      parser.push('REDUCE', options.REDUCE.toString());
    }

    parser.push('VALUES', vector.length.toString());
    for (const value of vector) {
      parser.push(transformDoubleArgument(value));
    }

    parser.push(element);

    if (options?.CAS) {
      parser.push('CAS');
    }

    if (options?.QUANT) {
      parser.push(options.QUANT);
    }

    if (options?.EF !== undefined) {
      parser.push('EF', options.EF.toString());
    }

    if (options?.SETATTR !== undefined) {
      parser.push(
        'SETATTR',
        typeof options.SETATTR === 'object' && !(options.SETATTR instanceof Buffer) ?
          JSON.stringify(options.SETATTR) :
          options.SETATTR
      );
    }

    if (options?.M !== undefined) {
      parser.push('M', options.M.toString());
    }
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
