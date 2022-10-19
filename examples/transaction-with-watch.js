import { createClient, WatchError } from 'redis';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const client = createClient();
await client.connect();

function restrictFunctionCalls(fn, maxCalls) {
  let count = 1;
  return function (...args) {
    return count++ < maxCalls ? fn(...args) : false;
  };
}

const fn = restrictFunctionCalls(transaction, 4);

async function transaction() {
  try {
    await client.executeIsolated(async (isolatedClient) => {
      await isolatedClient.watch('paymentId:1259');
      const multi = isolatedClient
        .multi()
        .set('paymentId:1259', 'Payment Successfully Completed!')
        .set('paymentId:1260', 'Refund Processed Successfully!');
      await delay(5000); // Do some changes to the watched key during this time...
      await multi.exec();
      console.log('Transaction completed Successfully!');
      client.quit();
    });
  } catch (error) {
    if (error instanceof WatchError) {
      console.log('Transaction Failed Due To Concurrent Modification!');
      fn();
    } else {
      console.log(`Error: ${error}`);
      client.quit();
    }
  }
}

transaction();
