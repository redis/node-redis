// Add data to a Redis TimeSeries and query it.
// Requires the RedisTimeSeries module: https://redistimeseries.io/

import { createClient } from 'redis';
import { TimeSeriesDuplicatePolicies, TimeSeriesEncoding} from '@node-redis/time-series';

async function timeSeries() {
  const client = createClient();

  await client.connect();
  await client.del('mytimeseries');

  try {
    // Create a timeseries 
    // https://oss.redis.com/redistimeseries/commands/#tscreate
    const created = await client.ts.create('mytimeseries', {
      RETENTION: 86400000, // 1 day in milliseconds
      ENCODING: TimeSeriesEncoding.UNCOMPRESSED, // No compression
      DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK // No duplicates
    });

    if (created === 'OK') {
      console.log('Created timeseries.');
    } else {
      console.log('Error creating timeseries :(');
      process.exit(1);
    }

    let value = Math.floor(Math.random() * 1000) + 1; // Random data point value
    let currentTimestamp = 1640995200000; // Jan 1 2022 00:00:00
    let num = 0;

    while (num < 10000) {
      // Add a new value to the timeseries, providing our own timestamp:
      // https://oss.redis.com/redistimeseries/commands/#tsadd
      await client.ts.add('mytimeseries', currentTimestamp, value);
      console.log(`Added timestamp ${currentTimestamp}, value ${value}.`);

      num += 1;
      value = Math.floor(Math.random() * 1000) + 1; // Get another random value
      currentTimestamp += 60000; // Move on one minute.
    }

    // Add multiple values to the timeseries in round trip to the server:
    // https://oss.redis.com/redistimeseries/commands/#tsmadd
    const response = await client.ts.mAdd([{
      key: 'mytimeseries',
      timestamp: currentTimestamp + 60000,
      value: Math.floor(Math.random() * 1000) + 1
    }, {
      key: 'mytimeseries',
      timestamp: currentTimestamp + 120000,
      value: Math.floor(Math.random() * 1000) + 1
    }]);

    // response = array of timestamps added by TS.MADD command.
    if (response.length === 2) {
      console.log('Added 2 entries to timeseries with TS.MADD.');
    }

    // Update timeseries retention with TS.ALTER:
    // https://oss.redis.com/redistimeseries/commands/#tsalter
    const alterResponse = await client.ts.alter('mytimeseries', {
      RETENTION: 0 // Keep the entries forever
    });

    if (alterResponse === 'OK') {
      console.log('Timeseries retention settings altered successfully.');
    }

    // Query the timeseries with TS.RANGE:
    // https://oss.redis.com/redistimeseries/commands/#tsrangetsrevrange
    const fromTimestamp = 0; // TODO UPDATE THESE...
    const toTimestamp = 0;
    //const rangeResponse = await client.ts.range('mytimeseries', fromTimestamp, toTimestamp, {
      // TODO SOME OPTIONS HERE...
    //});

    //console.log('RANGE RESPONSE:');
    //console.log(rangeResponse);

    // Get some information about the state of the timeseries.
    // https://oss.redis.com/redistimeseries/commands/#tsinfo
    const tsInfo = await client.ts.info('mytimeseries');
    
    // tsInfo looks like this:
    // {
    //   totalSamples: 1440,
    //   memoryUsage: 28904,
    //   firstTimestamp: 1641508920000,
    //   lastTimestamp: 1641595320000,
    //   retentionTime: 86400000,
    //   chunkCount: 7,
    //   chunkSize: 4096,
    //   chunkType: 'uncompressed',
    //   duplicatePolicy: 'block',
    //   labels: [],
    //   sourceKey: null,
    //   rules: []
    // }

    console.log('Timeseries info:');
    console.log(tsInfo);
  } catch (e) {
    console.error(e);
  }

  await client.quit();
}

timeSeries();
