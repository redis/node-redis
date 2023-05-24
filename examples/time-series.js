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


  /*
      Example Scenario: Your lab is conducting a study on coin flips in a haunted laboratory.
      USES: TS.ADD (with labels), TS.INFO, TS.MRANGE, TS.QUERYINDEX, TS.INCRBY and TS.DECRBY

      Example includes potential duplicate timestamps, which are handled by the duplicate policy.
      Also can demonstrate an error when trying to add a label with a value that is not a string.

  */
      console.log("\nHaunted Laboratory Coin Flip Study\n");
      // Tests to run
      const pennyFlipTests = [
        { currency: "USD", denomination: "Penny", duplicatePolicy: TimeSeriesDuplicatePolicies.BLOCK },
        { currency: "CAD", denomination: "Penny", duplicatePolicy: TimeSeriesDuplicatePolicies.LAST },
        { currency: "USD", denomination: "Nickel", duplicatePolicy: TimeSeriesDuplicatePolicies.LAST },
        { currency: "CAD", denomination: "Loonie", duplicatePolicy: TimeSeriesDuplicatePolicies.LAST },
      ];
    
      // Optional: Clear out existing timeseries for this example
      for (const test of pennyFlipTests) {
        // DEL command: https://redis.io/commands/del
        await client.del(`${test.currency}${test.denomination}`);
      }
    
      // You can track skipped timestamps due to duplicate policy.
      const skippedTimestamps = [];
    
      // Random label integer to demonstrate string requirement for label values
      const labID = Math.floor(Math.random() * 1000) + 1;
    
      // Coin Flip function
      function flipCoin() {
        const randomNumber = Math.random();
        if (randomNumber < 0.495) {
          return 0; // Heads
        } else if (randomNumber < 0.99) {
          return 1; // Tails
        } else {
          return 2; // Gravity is strange, in this lab, so we have a 1% chance of an edge landing.
        }
      }
    
      // Function to convert flip results to human readable text.
      function flipResult(value) {
        if (value === 0) {
          return "Heads";
        } else if (value === 1) {
          return "Tails";
        } else {
          return "Edge";
        }
      }
    
      // Loop to add coin flip results to the timeseries, with labels.
      const flipQuantity = 10; // Number of flips per test
    
      for (const pennyFlipTest of pennyFlipTests) {
        num = 0; // Reset counter
        while (num < flipQuantity) {
          const key = `${pennyFlipTest.currency}${pennyFlipTest.denomination}`;
          let flipValue = flipCoin(); // let, because ghosts
          // Add a new values with LABELS option:
          // https://redis.io/commands/ts.add/
          await client.ts
            .add(key, currentTimestamp, flipValue, {
              DUPLICATE_POLICY: pennyFlipTest.duplicatePolicy, // Default is BLOCK
              LABELS: {
                currency: `${pennyFlipTest.currency}`,
                denomination: `${pennyFlipTest.denomination}`,
                lab: `${labID}`, // Must be a string. Remove quotes to see error
              },
            })
            .catch((error) => {
              // Default duplicate policy is BLOCK, so we'll get an error if we try to add a duplicate timestamp.
              if (e.message.includes("DUPLICATE_POLICY")) {
                // console.log(`Duplicate timestamp at ${currentTimestamp}, value ${flipValue}. Skipping...`);
                skippedTimestamps.push({ currentTimestamp, flipValue });
                console.log(`Duplicate timestamp at ${currentTimestamp}, value ${flipValue}. Skipping...`);
              } else {
                console.log(error);
                // if the labID is not a string, we'll get an error here.
                // ([ErrorReply: ERR TSDB: the key does not exist])
              }
            });
    
          // Haunted Lab Scenario
          const randomIntervention = Math.floor(Math.random() * 10) + 1;
          const previousValue = flipValue;
          if (randomIntervention === 5) {
            // Choose INCRBY or DECRBY
            // TS.INCRBY adds a value to an existing timestamp.
            // https://redis.io/commands/ts.incrby
            // TS.DECRBY subtracts a value from an existing timestamp.
            // https://redis.io/commands/ts.decrby
            const incrDecr = Math.floor(Math.random() * 2) + 1 == 1 ? "decrBy" : "incrBy";
            const incrDecrValue = incrDecr === "decrBy" ? -1 : 1;
            const newValue = flipValue + incrDecrValue;
            if (newValue >= 0 || newValue <= 2) {
              // If the value is in range, we'll update the value and timestamp.
              flipValue += incrDecrValue;
              await client.ts[incrDecr](key, 1, currentTimestamp);
              console.log(
                `A strange force has intervened! The ${pennyFlipTest.currency} ${
                  pennyFlipTest.denomination
                } was ${flipResult(previousValue)}, but has changed to ${flipResult(flipValue)}!`
              );
            }
          }
    
          // Obligatory woohoo
          const woohoo = flipValue === 2 ? " Woohoo! " : "";
          console.log(
            `${new Date(currentTimestamp).toLocaleTimeString()}: The ${pennyFlipTest.currency} ${
              pennyFlipTest.denomination
            } landed on ${flipResult(flipValue)}.${woohoo}`
          );
    
          // Creating an intentional duplicate timestamp scenario on the last iteration, for demonstration purposes.
          if (num !== flipQuantity - 1) {
            // Create random delay between 2 and 10 seconds
            currentTimestamp += Math.floor(Math.random() * 8000) + 2000; // Move on one second.
          }
          num++;
        }
      }
      // Log or do something with skipped timestamps (optional).
      if (skippedTimestamps.length > 0) {
        console.log(`Skipped ${skippedTimestamps.length} timestamps due to duplicate policy.`);
      }
    
      // Get labels for each timeseries:
      const labels = await Promise.all(
        pennyFlipTests.map(async (pennyFlipTest) => {
          const keyInfo = await client.ts.info(`${pennyFlipTest.currency}${pennyFlipTest.denomination}`);
          // Remove the lab label from the array.
          return keyInfo.labels.filter((l) => l.name !== "lab");
        })
      );
      console.log("\nTS.INFO Labels", labels);
    
      // Concate the labels into a single array.
      const allLabels = labels.reduce((acc, val) => acc.concat(val), []);
      const possibleResults = ["Head", "Tail", "Edge"];
      // Set of unique label filters to prevent duplicate queries.
      const usedKeys = new Set();
      if (allLabels.length > 0) {
        for (const label of allLabels) {
          const labelFilter = `${label.name}=${label.value}`;
          // Get the timeseries keys for each label filter.
          // https://redis.io/commands/ts.queryindex
          const timeseriesKeys = await client.ts.queryIndex(labelFilter);
    
          // Only query the timeseries once per unique key/label pair.
          if (!usedKeys.has(labelFilter)) {
            // Query the timeseries with TS.MRANGE:
            // https://redis.io/commands/ts.mrange/
            const mrangeResponse = await client.ts.mRange("-", "+", [labelFilter, `lab=${labID}`]);
            console.log(
              `\n\nTS.MRANGE RESPONSE for ${labelFilter} (TS.QUERYINDEX Key${plural(
                timeseriesKeys.length
              )}: ${timeseriesKeys.join(", ")}):`
            );
            console.log(mrangeResponse);
    
            /*
              mrangeResponse contains an array of timeseries keys/samples that match the label query
              MRANGE RESPONSE for denomination=Penny:
              [
                {
                  key: 'USDPenny',
                  samples: [
                    { timestamp: 1640995200000, value: 0 },
                    { timestamp: 1640995201000, value: 2 },
                    ...etc
                    ]
                },
                {
                  key: 'CADPenny',
                  samples: [
                    { timestamp: 1640995228000, value: 0 },
                    { timestamp: 1640995229000, value: 1 },
                    ...etc
                    ]
                }
              ]
            */
    
            function calculateLongestStreak(array) {
              const streak = { longestStreak: 0, streakValue: 0 };
              let currentStreak = 0;
              for (let i = 0; i < array.length; i++) {
                if (array[i] === array[i - 1]) {
                  currentStreak++;
                  if (currentStreak > streak.longestStreak) {
                    streak.longestStreak = currentStreak;
                    streak.streakValue = array[i];
                  }
                } else {
                  currentStreak = 1;
                }
              }
              return streak;
            }
    
            function plural(num) {
              return num === 1 ? "" : "s";
            }
    
            function percent(num, total) {
              return `${((num / total) * 100).toFixed(2)}%`;
            }
    
            // Log the sample key name and the total number of heads, tails and edge.
            mrangeResponse.forEach((mrange) => {
              // Log the possibleResults with counts greater than 0.
              const resultsArray = [];
              for (const result of possibleResults) {
                const count = mrange.samples.filter((s) => s.value === possibleResults.indexOf(result)).length;
                if (count > 0) {
                  resultsArray.push(`${count} ${result}${plural(count)} ${percent(count, mrange.samples.length)}`);
                }
              }
              console.log(`---\n${mrange.key} results: ${resultsArray.join(", ")}.`);
              // CADLoonie results: 2 Heads 20.00%, 7 Tails 70.00%, 1 Edge 10.00%.
    
              console.log(`Flip Sequence: ${mrange.samples.map((s) => `${flipResult(s.value)}`).join(", ")}`);
              // Flip Sequence: Tails, Heads, Tails, Tails, Tails, Heads, Tails, Edge, Tails, Tails
    
              const averageTimeBetweenFlips = Math.round(
                (mrange.samples[mrange.samples.length - 1].timestamp - mrange.samples[0].timestamp) /
                  (mrange.samples.length - 1)
              );
              console.log(`Average time between flips: ${averageTimeBetweenFlips / 1000}s.`);
              // Average time between flips: 6.131s.
    
              const streak = calculateLongestStreak(mrange.samples.map((s) => s.value));
              console.log(`Longest streak: ${streak.longestStreak} ${flipResult(streak.streakValue)} in a row.`);
              // Longest streak: 3 Tails in a row.
            });
          }
          usedKeys.add(labelFilter);
        }
      }
      const fullLabResults = await client.ts.mRange("-", "+", [`lab=${labID}`]);
      const numberOfEdgeFlips = fullLabResults.reduce((acc, val) => {
        return acc + val.samples.filter((s) => s.value === 2).length;
      }, 0);
    
      const edgeFlipEmotion = numberOfEdgeFlips > 0 ? ":)" : ":(";
      console.log(`\n\nTotal number of edge flips: ${numberOfEdgeFlips} ${edgeFlipEmotion}`);
      // Total number of edge flips: 1 :)
    
      // Best coins for edge flipping:
      const edgeFlips = await client.ts.mRange("-", "+", [`lab=${labID}`]);
      const edgeFlipsByCoin = edgeFlips.reduce((acc, val) => {
        // console.log(val.samples.filter((s) => s.value === 2));
        acc[val.key] = val.samples.filter((s) => s.value === 2).length;
        return acc;
      }, {});
      if (Object.values(edgeFlipsByCoin).some((v) => v > 0)) {
        console.log("Edge flips by coin:", edgeFlipsByCoin);
        // Edge flips by coin: { CADLoonie: 1, CADPenny: 0, USDNickel: 0, USDPenny: 0 }
      }
    } catch (e) {
      console.error(e);
    }
    
    await client.quit();
    