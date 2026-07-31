/**
 * Aggregates multiple arrays of numbers using logical AND operation.
 * @remarks
 * This implementation is specifically designed for Array<Array<number>> type only,
 * despite the generic type parameter. It is currently used by the SCRIPT EXISTS command
 * which returns an array of 0s and 1s from each shard.
 * The generic type parameter T is provided for usage ergonomy, but the actual input structure
 * will be validated at runtime.
 */
export const aggregateLogicalAnd = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return [] as T;
  if (
    !replies.every(
      (reply): reply is number[] =>
        Array.isArray(reply) &&
        reply.every((value): value is number => typeof value === 'number')
    )
  ) {
    throw new Error(
      'All replies must be array of numbers for logical AND aggregation'
    );
  }

  const result = Array(replies[0].length).fill(1);

  for (const reply of replies) {
    for (let i = 0; i < reply.length; i++) {
      // clamp to 0/1: `&&` returns the operand, so non-binary replies would
      // otherwise leak through (e.g. 1 && 2 === 2).
      result[i] = result[i] && reply[i] ? 1 : 0;
    }
  }

  return result as T;
};

/**
 * Aggregates multiple arrays of numbers using logical OR operation.
 * @remarks
 * Mirror of `aggregateLogicalAnd` for the `agg_logical_or` response policy.
 * No command in the current metadata snapshot uses it, but the reducer is
 * registered in `RESPONSE_REDUCERS`, so it must be correct for the first
 * command a future metadata regeneration tags with it.
 */
export const aggregateLogicalOr = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return [] as T;
  if (
    !replies.every(
      (reply): reply is number[] =>
        Array.isArray(reply) &&
        reply.every((value): value is number => typeof value === 'number')
    )
  ) {
    throw new Error(
      'All replies must be array of numbers for logical OR aggregation'
    );
  }

  const result = Array(replies[0].length).fill(0);

  for (const reply of replies) {
    for (let i = 0; i < reply.length; i++) {
      // clamp to 0/1: `||` returns the operand, so non-binary replies would
      // otherwise leak through (e.g. 0 || 3 === 3).
      result[i] = result[i] || reply[i] ? 1 : 0;
    }
  }

  return result as T;
};

/**
 * Per-position reduce over array replies. Validates that every reply is a
 * number array of the same length, then folds column-wise with `reduce`.
 * Shared by the array path of `aggregateMin`/`aggregateMax` so element-wise
 * aggregation matches the server's AGG_MIN/AGG_MAX semantics for commands
 * whose reply is an array (e.g. WAITAOF's `[numlocal, numreplicas]`).
 */
const aggregateElementwise = (
  replies: Array<unknown>,
  reduce: (a: number, b: number) => number,
  label: string
): Array<number> => {
  const length = (replies[0] as Array<unknown>).length;
  if (
    !replies.every(
      (reply): reply is number[] =>
        Array.isArray(reply) &&
        reply.length === length &&
        reply.every((value): value is number => typeof value === 'number')
    )
  ) {
    throw new Error(
      `All replies must be number arrays of equal length for ${label} aggregation`
    );
  }

  const result = (replies[0] as number[]).slice();
  for (let r = 1; r < replies.length; r++) {
    const reply = replies[r] as number[];
    for (let i = 0; i < length; i++) {
      result[i] = reduce(result[i], reply[i]);
    }
  }
  return result;
};

/**
 * Aggregates shard replies by taking the minimum value.
 * @remarks
 * Scalar replies (e.g. WAIT, the minimal number of synchronized replicas) fold
 * to a single minimum; array replies (e.g. WAITAOF's `[numlocal, numreplicas]`)
 * fold element-wise, matching the server's AGG_MIN semantics. Input structure
 * is validated at runtime; the generic `T` is for call-site ergonomy only.
 */
export const aggregateMin = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return 0 as T;
  if (Array.isArray(replies[0])) {
    return aggregateElementwise(replies, Math.min, 'min') as T;
  }
  if (!replies.every((reply): reply is number => typeof reply === 'number')) {
    throw new Error('All replies must be numbers for min aggregation');
  }
  return Math.min(...replies) as T;
};

/**
 * Aggregates shard replies by taking the maximum value.
 * @remarks
 * Mirrors {@link aggregateMin}: scalar replies fold to a single maximum, array
 * replies fold element-wise (AGG_MAX semantics). Input structure is validated
 * at runtime; the generic `T` is for call-site ergonomy only.
 */
export const aggregateMax = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return 0 as T;
  if (Array.isArray(replies[0])) {
    return aggregateElementwise(replies, Math.max, 'max') as T;
  }
  if (!replies.every((reply): reply is number => typeof reply === 'number')) {
    throw new Error('All replies must be numbers for max aggregation');
  }
  return Math.max(...replies) as T;
};

/**
 * Aggregates multiple numbers by finding the sum of all values.
 * @remarks
 * This implementation is specifically designed for Array<number> type only,
 * despite the generic type parameter. The generic type parameter T is provided
 * for usage ergonomy, but the actual input structure will be validated at runtime.
 */
export const aggregateSum = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return 0 as T;
  if (!replies.every((reply): reply is number => typeof reply === 'number')) {
    throw new Error('All replies must be numbers for sum aggregation');
  }
  return replies.reduce((acc, reply) => acc + reply, 0) as T;
};


export const aggregateMerge = <T>(replies: Array<unknown>): T => {
	if(replies.length === 0) return undefined as T;

	const firstReply = replies[0]

	if(Array.isArray(firstReply)) {
		const set = new Set()
		for(const reply of replies) {
			for(const item of reply as Array<unknown>) {
				set.add(item);
			}
		}
		return Array.from(set) as T;
	}

	if(firstReply instanceof Map) {
		const map = new Map();
		for(const reply of replies) {
			for(const [key, value] of reply as Map<unknown, unknown>) {
				map.set(key, value);
			}
		}
		return map as T;
	}

	// RESP3 map replies decode to plain objects under the default type
	// mapping; merge them like the Map branch (last node wins per key).
	if(typeof firstReply === 'object' && firstReply !== null) {
		const merged: Record<string, unknown> = {};
		for(const reply of replies) {
			Object.assign(merged, reply);
		}
		return merged as T;
	}

	throw new Error('Unsupported reply type for merge aggregation');

};
