// This example shows you sample transaction for how to achieve optimistic locking using WATCH with check-and-set (CAS) behavior.
// If any watched key changes outside the session then entire transaction will be aborted.
// To know more about isolated execution & redis transaction: https://github.com/redis/node-redis/blob/master/docs/isolated-execution.md
// https://redis.io/docs/manual/transactions

// We just have to repeat the operation by calling the function again(recursion) hoping this time we'll not get race condition.
// restrictFunctionCalls is a counter function to limit recursive calls

import { createClient, WatchError } from 'redis';

const client = createClient();
await client.connect();

/**
 *
 * @param {function} fn
 * @param {number} maxCalls
 * @returns a function that is being called based on maxCalls
 */
function restrictFunctionCalls(fn, maxCalls) {
  let count = 1;
  return function (...args) {
    return count++ < maxCalls ? fn(...args) : false;
  };
}
let fn = restrictFunctionCalls(transaction, 4);
async function transaction() {
  try {
    await client.executeIsolated(async (isolatedClient) => {
      await isolatedClient.watch('paymentId:1259');
      const multi = isolatedClient
        .multi()
        .set('paymentId:1259', 'Payment Successfully Completed!')
        .set('paymentId:1260', 'Refund Processed Successfully!');
      await multi.exec();
      console.log('Transaction completed Successfully!');
    });
  } catch (error) {
    if (error instanceof WatchError) {
      console.log('Transaction Failed Due To Concurrent Modification!');
      fn();
    } else {
      console.log(`Error: ${error}`);
    }
  }
}

transaction();

await client.quit();
