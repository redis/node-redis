// Add data to a Redis TimeSeries and query it.
// Requires the RedisTimeSeries module: https://redis.io/docs/stack/timeseries/

import { createClient } from 'redis';
import { TimeSeriesDuplicatePolicies, TimeSeriesEncoding, TimeSeriesAggregationType } from '@redis/time-series';

const client = createClient();

await client.connect();
await client.del('mytimeseries');

try {
  // Create a timeseries
  // https://redis.io/commands/ts.create/
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
    // https://redis.io/commands/ts.add/
    await client.ts.add('mytimeseries', currentTimestamp, value);
    console.log(`Added timestamp ${currentTimestamp}, value ${value}.`);

    num += 1;
    value = Math.floor(Math.random() * 1000) + 1; // Get another random value
    currentTimestamp += 1000; // Move on one second.
  }

  // Add multiple values to the timeseries in round trip to the server:
  // https://redis.io/commands/ts.madd/
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
  // https://redis.io/commands/ts.alter/
  const alterResponse = await client.ts.alter('mytimeseries', {
    RETENTION: 0 // Keep the entries forever
  });

  if (alterResponse === 'OK') {
    console.log('Timeseries retention settings altered successfully.');
  }

  // Query the timeseries with TS.RANGE:
  // https://redis.io/commands/ts.range/
  const fromTimestamp = 1640995200000; // Jan 1 2022 00:00:00
  const toTimestamp = 1640995260000; // Jan 1 2022 00:01:00
  const rangeResponse = await client.ts.range('mytimeseries', fromTimestamp, toTimestamp, {
    // Group into 10 second averages.
    AGGREGATION: {
      type: TimeSeriesAggregationType.AVERAGE,
      timeBucket: 10000
    }
  });

  console.log('RANGE RESPONSE:');
  // rangeResponse looks like:
  // [
  //   { timestamp: 1640995200000, value: 356.8 },
  //   { timestamp: 1640995210000, value: 534.8 },
  //   { timestamp: 1640995220000, value: 481.3 },
  //   { timestamp: 1640995230000, value: 437 },
  //   { timestamp: 1640995240000, value: 507.3 },
  //   { timestamp: 1640995250000, value: 581.2 },
  //   { timestamp: 1640995260000, value: 600 }
  // ]

  console.log(rangeResponse);

  // Get some information about the state of the timeseries.
  // https://redis.io/commands/ts.info/
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

  // Add a new values with LABELS option USING TS.ADD:
  // https://redis.io/commands/ts.add/
  const labelTimeSeriesKey1 = "mytimeseries-labels-1";
  const labelTimeSeriesKey2 = "mytimeseries-labels-2";
  num = 0; // Reset counter
  // You can track skipped timestamps due to duplicate policy (OPTIONAL)
  const skippedTimestamps = [];
  // Generate a random integer to use as a label value (can demonstrate error, if not a string)
  const integerLabelValue1 = Math.floor(Math.random() * 1000) + 1;
  // Sample loop to add 10 values to the timeseries, with labels.
  console.log("Starting loop 1...");
  while (num < 10) {
    await client.ts
      .add(labelTimeSeriesKey1, currentTimestamp, value + num, {
        LABELS: {
          foo: "bar",
          bax: `${integerLabelValue1}`, // Must be a string. Remove quotes to see error.
        },
      })
      .catch((e) => {
        // Default duplicate policy is BLOCK, so we'll get an error if we try to add a duplicate timestamp.
        if (e.message.includes("DUPLICATE_POLICY")) {
          // console.log(`Duplicate timestamp at ${currentTimestamp}, value ${value}. Skipping...`);
          skippedTimestamps.push({ currentTimestamp, value });
        }
      });
    console.log(`Added timestamp ${currentTimestamp}, value ${value} to ${labelTimeSeriesKey1}.`);
    currentTimestamp += 1000; // Move on one second.
    num += 1;
  }

  console.log("Starting loop 2...");
  num = 0; // Reset counter
  const integerLabelValue2 = Math.floor(Math.random() * 1000) + 1;
  while (num < 5) {
    await client.ts
      .add(labelTimeSeriesKey2, currentTimestamp, value + num, {
        DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.LAST, // Default is BLOCK
        LABELS: {
          foo: "baz",
          bax: `${integerLabelValue2}`, // Must be a string. Remove quotes to see error.
        },
      })
      .catch((e) => {
        // Default duplicate policy is BLOCK, so we'll get an error if the attribute successfully set.
        // In this loop, we set DUPLICATE_POLICY to LAST, so we shouldn't get that error.
        if (e.message.includes("DUPLICATE_POLICY")) {
          // console.log(`Duplicate timestamp at ${currentTimestamp}, value ${value}. Skipping...`);
          skippedTimestamps.push({ currentTimestamp, value });
        }
      });
    console.log(`Added timestamp ${currentTimestamp}, value ${value} to ${labelTimeSeriesKey2}.`);
    currentTimestamp += 1000; // Move on one second.
    num += 1;
  }

  // Log or do something with skipped timestamps (optional).
  if (skippedTimestamps.length > 0) {
    console.log(`Skipped ${skippedTimestamps.length} timestamps due to duplicate policy.`);
  }

  // Get labels for timeseries:
  const { labels: label1 } = await client.ts.info(labelTimeSeriesKey1);
  const { labels: label2 } = await client.ts.info(labelTimeSeriesKey2);
  console.log(label1);
  // [ { name: 'foo', value: 'bar' }, { name: 'bax', value: '771' } ]
  console.log(label2);
  // [ { name: 'foo', value: 'baz' }, { name: 'bax', value: '198' } ]

  // Query the timeseries with TS.MRANGE:
  // https://redis.io/commands/ts.mrange/

  // Merge the labels from both timeseries into a single array, for looping purposes.
  const labels = label1.concat(label2);
  if (labels && labels.length > 0) {
    // Loop through the labels and query the timeseries for each label.
    for (const label of labels) {
      // The label filter can be any label=value pair, or an array of label=value string pairs.
      // See the MRANGE documentation for more information combinations of label filters, besides =
      const labelFilter = `${label.name}=${label.value}`;
      const mrangeResponse = await client.ts.mRange("-", "+", labelFilter); // Adjust start/end times as needed.
      console.log(`MRANGE RESPONSE for ${labelFilter}:`);
      console.log(mrangeResponse);
      // mrangeResponse contains an array of timeseries keys/samples that match the label query
      // [
      //   {
      //     key: 'mytimeseries-labels-1',
      //     samples: [
      //       { timestamp: 1641508920000, value: 0 },
      //       { timestamp: 1641508930000, value: 1 },
      //     ],
      //   },
      //   ... etc
      // ]

      // In this example, foo=bar will match 10 samples, foo=baz will match 5 samples
      // bax=<integer> will match 5 samples, unless the integerLabelValue is the same for both timeseries, in which case it will match 15 samples.
    }
  }

} catch (e) {
  console.error(e);
}

await client.quit();
