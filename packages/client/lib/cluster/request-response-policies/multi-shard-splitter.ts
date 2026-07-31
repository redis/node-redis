import calculateSlot from 'cluster-key-slot';
import type { RedisArgument } from '../../RESP/types';
import type { KeySpec } from '../../commands/generic-transformers';

export type SubCommand = {
  args: Array<RedisArgument>;
  /**
   * 0-based ordinals of this sub-command's key groups in the original
   * command, for order-preserving reply reassembly (e.g. MGET).
   */
  groupIndices: Array<number>;
  /**
   * Absolute indices into `args` of this sub-command's keys (the first arg of
   * each group). Lets the caller build a sub-parser that marks keys, so core
   * `_execute` routes by the sub-command's own `firstKey`.
   */
  keyPositions: Array<number>;
};

/**
 * Splits a multi_shard command's arguments into one sub-command per hash
 * slot, using the command's COMMAND key specification as the reconstruction
 * recipe ("the command must be split even if all the slots are managed by
 * the same shard" — but same-*slot* commands pass through unsplit).
 *
 * Each key group is the key plus its `keyStep - 1` trailing siblings (e.g.
 * MSET's value). A sub-command is prefix + that slot's groups (in original
 * relative order) + suffix; for `keynum` specs the numkeys argument in the
 * prefix is rewritten to the sub-command's group count.
 *
 * Throws on anything it cannot split deterministically — a wrong split of a
 * write command means corrupted data, so refusal beats guessing. All current
 * multi_shard commands (DEL, UNLINK, EXISTS, TOUCH, MGET, MSET) declare
 * exactly one supported spec. MSETEX is curated OUT of multi_shard
 * (command-metadata-overrides.ts): its NX/XX condition is all-or-nothing
 * across all keys and cannot be evaluated per shard — it routes default-keyed
 * like MSETNX, so the keynum branch below currently has no live caller.
 */
export function splitMultiShardCommand(
  args: ReadonlyArray<RedisArgument>,
  keySpecs: ReadonlyArray<KeySpec> | undefined
): Map<number, SubCommand> {
  const label = args.length > 0 ? args[0].toString() : '<empty>';

  if (!keySpecs || keySpecs.length === 0) {
    throw new Error(`Cannot split ${label}: command has no key specification`);
  }
  // TODO(multi-spec): a command whose keys are interchangeable but
  // syntactically scattered (e.g. a fixed-position key plus a keyword-tail
  // list) could legitimately be multi_shard with several specs, and
  // multi-region reconstruction would be deterministic. No such command
  // exists, and specs alone cannot distinguish that shape from linked-operand
  // specs (GEORADIUS-like) where splitting is meaningless — so refuse until a
  // real command motivates multi-region support.
  if (keySpecs.length > 1) {
    throw new Error(`Cannot split ${label}: multiple key specifications are not supported`);
  }

  const { beginSearch, findKeys } = keySpecs[0];
  if (beginSearch.type !== 'index') {
    throw new Error(`Cannot split ${label}: unsupported begin_search type '${beginSearch.type}'`);
  }

  const start = beginSearch.index;
  let keyRegionStart: number;
  let keyRegionEnd: number;
  let keyStep: number;
  // Absolute position of the numkeys argument to rewrite per sub-command.
  let keyNumIdx: number | undefined;

  switch (findKeys.type) {
    case 'range': {
      // All current multi_shard range specs are "until end of args"; bounded
      // ranges (lastKey >= 0) and limit can be added when a command needs them.
      if (findKeys.lastKey !== -1 || findKeys.limit !== 0) {
        throw new Error(`Cannot split ${label}: unsupported find_keys range (lastkey ${findKeys.lastKey}, limit ${findKeys.limit})`);
      }
      keyStep = findKeys.keyStep;
      keyRegionStart = start;
      keyRegionEnd = args.length;
      break;
    }
    case 'keynum': {
      keyStep = findKeys.keyStep;
      keyNumIdx = start + findKeys.keyNumIdx;
      keyRegionStart = start + findKeys.firstKey;
      if (keyNumIdx >= keyRegionStart) {
        throw new Error(`Cannot split ${label}: numkeys argument inside the key region`);
      }
      const numKeys = parsePositiveInteger(args[keyNumIdx]);
      if (numKeys === undefined) {
        throw new Error(`Cannot split ${label}: malformed numkeys argument '${args[keyNumIdx]}'`);
      }
      keyRegionEnd = keyRegionStart + numKeys * keyStep;
      break;
    }
    default:
      throw new Error(`Cannot split ${label}: unsupported find_keys type '${findKeys.type}'`);
  }

  if (keyStep < 1) {
    throw new Error(`Cannot split ${label}: invalid keystep ${keyStep}`);
  }
  if (keyRegionStart < 1 || keyRegionEnd > args.length) {
    throw new Error(`Cannot split ${label}: key region overruns the arguments`);
  }
  const regionLength = keyRegionEnd - keyRegionStart;
  if (regionLength <= 0 || regionLength % keyStep !== 0) {
    throw new Error(`Cannot split ${label}: key region does not align with keystep ${keyStep}`);
  }

  const groupCount = regionLength / keyStep;
  const slotGroups = new Map<number, Array<number>>();
  for (let group = 0; group < groupCount; group++) {
    const slot = calculateSlot(args[keyRegionStart + group * keyStep]);
    const groups = slotGroups.get(slot);
    if (groups) {
      groups.push(group);
    } else {
      slotGroups.set(slot, [group]);
    }
  }

  const subCommands = new Map<number, SubCommand>();

  // Single-slot fast path: nothing to split — pass the original command
  // through untouched (also preserves single-slot atomicity). Keys keep their
  // original absolute positions.
  if (slotGroups.size === 1) {
    const [[slot, groupIndices]] = slotGroups;
    const keyPositions = groupIndices.map(group => keyRegionStart + group * keyStep);
    subCommands.set(slot, { args: [...args], groupIndices, keyPositions });
    return subCommands;
  }

  const suffix = args.slice(keyRegionEnd);
  for (const [slot, groupIndices] of slotGroups) {
    const subArgs = args.slice(0, keyRegionStart);
    if (keyNumIdx !== undefined) {
      subArgs[keyNumIdx] = groupIndices.length.toString();
    }
    // Groups are appended in order, each keyStep wide with the key first, so
    // the j-th group's key lands at keyRegionStart + j * keyStep in subArgs.
    const keyPositions: Array<number> = [];
    groupIndices.forEach((group, j) => {
      keyPositions.push(keyRegionStart + j * keyStep);
      const groupStart = keyRegionStart + group * keyStep;
      for (let i = 0; i < keyStep; i++) {
        subArgs.push(args[groupStart + i]);
      }
    });
    subArgs.push(...suffix);
    subCommands.set(slot, { args: subArgs, groupIndices, keyPositions });
  }

  return subCommands;
}

function parsePositiveInteger(arg: RedisArgument | undefined): number | undefined {
  if (arg === undefined) return undefined;
  const value = Number(arg.toString());
  return Number.isInteger(value) && value > 0 ? value : undefined;
}
