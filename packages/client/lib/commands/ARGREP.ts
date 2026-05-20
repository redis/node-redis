import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { Tail } from './generic-transformers';

export const AR_PREDICATE_TYPES = {
  EXACT: 'EXACT',
  MATCH: 'MATCH',
  GLOB: 'GLOB',
  RE: 'RE'
} as const;

export type ArPredicateType = typeof AR_PREDICATE_TYPES[keyof typeof AR_PREDICATE_TYPES];

export const AR_PREDICATE_COMBINATORS = {
  AND: 'AND',
  OR: 'OR'
} as const;

export type ArPredicateCombinator = typeof AR_PREDICATE_COMBINATORS[keyof typeof AR_PREDICATE_COMBINATORS];

export type ArGrepPredicate = [type: ArPredicateType, value: RedisArgument];

/**
 * Bound for an ARGREP range: a numeric index, the literal `'-'` (open-ended
 * lower bound), the literal `'+'` (open-ended upper bound), or a decimal
 * string (use this when an index would exceed `Number.MAX_SAFE_INTEGER`).
 */
export type ArGrepBound = number | '-' | '+' | string;

export interface ArGrepOptions {
  COMBINATOR?: ArPredicateCombinator;
  LIMIT?: number;
  NOCASE?: boolean;
}

export function parseArGrepArguments(
  parser: CommandParser,
  key: RedisArgument,
  start: ArGrepBound,
  end: ArGrepBound,
  predicates: Array<ArGrepPredicate>,
  options?: ArGrepOptions
) {
  parser.pushKey(key);
  parser.push(
    typeof start === 'number' ? start.toString() : start,
    typeof end === 'number' ? end.toString() : end
  );

  for (const [type, value] of predicates) {
    parser.push(type, value);
  }

  if (options?.COMBINATOR !== undefined) {
    parser.push(options.COMBINATOR);
  }

  if (options?.LIMIT !== undefined) {
    parser.push('LIMIT', options.LIMIT.toString());
  }

  if (options?.NOCASE) {
    parser.push('NOCASE');
  }
}

export type ArGrepArguments = Tail<Parameters<typeof parseArGrepArguments>>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, ...args: ArGrepArguments) {
    parser.push('ARGREP');
    parseArGrepArguments(parser, ...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
