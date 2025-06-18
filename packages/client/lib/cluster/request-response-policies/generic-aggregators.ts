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
      result[i] = result[i] && reply[i];
    }
  }

  return result as T;
};

//TODO fix this
export const aggregateLogicalOr = <T>(
  replies: Array<unknown>
): T => {
  const result = Array((replies[0] as Array<unknown>).length).fill(1);
  for (const reply of replies) {
    for (let i = 0; i < (reply as Array<unknown>).length; i++) {
      result[i] = result[i] || (reply as Array<unknown>)[i];
    }
  }
  return result as T;
};

/**
 * Aggregates multiple numbers by finding the minimum value.
 * @remarks
 * This implementation is specifically designed for Array<number> type only,
 * despite the generic type parameter. It is used by commands like WAIT
 * which returns the minimal number of synchronized replicas from all shards.
 * The generic type parameter T is provided for usage ergonomy, but the actual input structure
 * will be validated at runtime.
 */
export const aggregateMin = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return 0 as T;
  if (!replies.every((reply): reply is number => typeof reply === 'number')) {
    throw new Error('All replies must be numbers for min aggregation');
  }
  return Math.min(...replies) as T;
};

/**
 * Aggregates multiple numbers by finding the maximum value.
 * @remarks
 * This implementation is specifically designed for Array<number> type only,
 * despite the generic type parameter. The generic type parameter T is provided
 * for usage ergonomy, but the actual input structure will be validated at runtime.
 */
export const aggregateMax = <T>(replies: Array<unknown>): T => {
  if (replies.length === 0) return 0 as T;
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

	//TODO, maybe this needs to be plain object
	if(firstReply instanceof Map) {
		const map = new Map();
		for(const reply of replies) {
			for(const [key, value] of reply as Map<unknown, unknown>) {
				map.set(key, value);
			}
		}
		return map as T;
	}

	//TODO remove 
	console.log('firstReply', firstReply, typeof firstReply);
	throw new Error('Unsupported reply type for merge aggregation');

};
