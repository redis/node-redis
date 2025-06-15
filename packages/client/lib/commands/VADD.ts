import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformDoubleArgument } from './generic-transformers';

export interface VAddOptions {
  REDUCE?: number;
  CAS?: boolean;
  NOQUANT?: boolean;
  Q8?: boolean;
  BIN?: boolean;
  EF?: number;
  SETATTR?: Record<string, any>;
  M?: number;
}

export default {
  /**
   * Add a new element into the vector set specified by key
   * 
   * @param parser - The command parser
   * @param key - The name of the key that will hold the vector set data
   * @param vector - The vector data as FP32 blob or array of numbers
   * @param element - The name of the element being added to the vector set
   * @param options - Optional parameters for vector addition
   * @see https://redis.io/commands/vadd/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    vector: RedisArgument | Array<number>,
    element: RedisArgument,
    options?: VAddOptions
  ) {
    parser.push('VADD');
    parser.pushKey(key);

    if (options?.REDUCE !== undefined) {
      parser.push('REDUCE', options.REDUCE.toString());
    }

    if (Array.isArray(vector)) {
      parser.push('VALUES', vector.length.toString());
      for (const value of vector) {
        parser.push(transformDoubleArgument(value));
      }
    } else {
      parser.push('FP32', vector);
    }

    parser.push(element);

    if (options?.CAS) {
      parser.push('CAS');
    }

    if (options?.NOQUANT) {
      parser.push('NOQUANT');
    } else if (options?.Q8) {
      parser.push('Q8');
    } else if (options?.BIN) {
      parser.push('BIN');
    }

    if (options?.EF !== undefined) {
      parser.push('EF', options.EF.toString());
    }

    if (options?.SETATTR) {
      parser.push('SETATTR', JSON.stringify(options.SETATTR));
    }

    if (options?.M !== undefined) {
      parser.push('M', options.M.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
