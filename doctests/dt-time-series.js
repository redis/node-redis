// EXAMPLE: time_series_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';
import { TIME_SERIES_AGGREGATION_TYPE, TIME_SERIES_REDUCERS } from '@redis/time-series';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.del([
  'thermometer:1', 'thermometer:2', 'thermometer:3',
  'rg:1', 'rg:2', 'rg:3', 'rg:4',
  'sensor3',
  'wind:1', 'wind:2', 'wind:3', 'wind:4',
  'hyg:1', 'hyg:compacted'
]);
// REMOVE_END

// STEP_START create
const res1 = await client.ts.create('thermometer:1');
console.log(res1); // >>> OK

const res2 = await client.type('thermometer:1');
console.log(res2); // >>> TSDB-TYPE

const res3 = await client.ts.info('thermometer:1');
console.log(res3);
// >>> { rules: [], ... totalSamples: 0, ...
// STEP_END
// REMOVE_START
assert.equal(res1, 'OK');
assert.equal(res2, 'TSDB-TYPE');
assert.equal(res3.totalSamples, 0);
// REMOVE_END

// STEP_START create_retention
const res4 = await client.ts.add('thermometer:2', 1, 10.8, { RETENTION: 100 });
console.log(res4); // >>> 1

const res5 = await client.ts.info('thermometer:2');
console.log(res5);
// >>> { rules: [], ... retentionTime: 100, ...
// STEP_END
// REMOVE_START
assert.equal(res4, 1);
assert.equal(res5.retentionTime, 100);
// REMOVE_END

// STEP_START create_labels
const res6 = await client.ts.add('thermometer:3', 1, 10.4, {
  LABELS: { location: 'UK', type: 'Mercury' }
});
console.log(res6); // >>> 1

const res7 = await client.ts.info('thermometer:3');
console.log(res7);
// >>> { labels: [{ name: 'location', value: 'UK' }, { name: 'type', value: 'Mercury' }], ... }
// STEP_END
// REMOVE_START
assert.equal(res6, 1);
assert.deepEqual(res7.labels, [
  { name: 'location', value: 'UK' },
  { name: 'type', value: 'Mercury' },
]);
// REMOVE_END

// STEP_START madd
const res8 = await client.ts.mAdd([
  { key: 'thermometer:1', timestamp: 1, value: 9.2 },
  { key: 'thermometer:1', timestamp: 2, value: 9.9 },
  { key: 'thermometer:2', timestamp: 2, value: 10.3 }
]);
console.log(res8); // >>> [1, 2, 2]
// STEP_END
// REMOVE_START
assert.deepEqual(res8, [1, 2, 2]);
// REMOVE_END

// STEP_START get
// The last recorded temperature for thermometer:2
// was 10.3 at time 2.
const res9 = await client.ts.get('thermometer:2');
console.log(res9); // >>> { timestamp: 2, value: 10.3 }
// STEP_END
// REMOVE_START
assert.equal(res9.timestamp, 2);
assert.equal(res9.value, 10.3);
// REMOVE_END

// STEP_START range
// Add 5 data points to a time series named "rg:1".
const res10 = await client.ts.create('rg:1');
console.log(res10); // >>> OK

const res11 = await client.ts.mAdd([
  { key: 'rg:1', timestamp: 0, value: 18 },
  { key: 'rg:1', timestamp: 1, value: 14 },
  { key: 'rg:1', timestamp: 2, value: 22 },
  { key: 'rg:1', timestamp: 3, value: 18 },
  { key: 'rg:1', timestamp: 4, value: 24 }
]);
console.log(res11); // >>> [0, 1, 2, 3, 4]

// Retrieve all the data points in ascending order.
const res12 = await client.ts.range('rg:1', '-', '+');
console.log(res12);
// >>> [{ timestamp: 0, value: 18 }, { timestamp: 1, value: 14 }, ...]

// Retrieve data points up to time 1 (inclusive).
const res13 = await client.ts.range('rg:1', '-', 1);
console.log(res13);
// >>> [{ timestamp: 0, value: 18 }, { timestamp: 1, value: 14 }]

// Retrieve data points from time 3 onwards.
const res14 = await client.ts.range('rg:1', 3, '+');
console.log(res14);
// >>> [{ timestamp: 3, value: 18 }, { timestamp: 4, value: 24 }]

// Retrieve all the data points in descending order.
const res15 = await client.ts.revRange('rg:1', '-', '+');
console.log(res15);
// >>> [{ timestamp: 4, value: 24 }, { timestamp: 3, value: 18 }, ...]

// Retrieve data points up to time 1 (inclusive), but return them
// in descending order.
const res16 = await client.ts.revRange('rg:1', '-', 1);
console.log(res16);
// >>> [{ timestamp: 1, value: 14 }, { timestamp: 0, value: 18 }]
// STEP_END
// REMOVE_START
assert.equal(res10, 'OK');
assert.deepEqual(res11, [0, 1, 2, 3, 4]);

assert.deepEqual(res12, [
  { timestamp: 0, value: 18 },
  { timestamp: 1, value: 14 },
  { timestamp: 2, value: 22 },
  { timestamp: 3, value: 18 },
  { timestamp: 4, value: 24 }
]);
assert.deepEqual(res13, [
  { timestamp: 0, value: 18 },
  { timestamp: 1, value: 14 }
]);
assert.deepEqual(res14, [
  { timestamp: 3, value: 18 },
  { timestamp: 4, value: 24 }
]);
assert.deepEqual(res15, [
  { timestamp: 4, value: 24 },
  { timestamp: 3, value: 18 },
  { timestamp: 2, value: 22 },
  { timestamp: 1, value: 14 },
  { timestamp: 0, value: 18 }
]);
assert.deepEqual(res16, [
  { timestamp: 1, value: 14 },
  { timestamp: 0, value: 18 }
]);
// REMOVE_END

// STEP_START range_filter
const res17 = await client.ts.range('rg:1', '-', '+', {
  FILTER_BY_TS: [0, 2, 4]
});
console.log(res17);
// >>> [{ timestamp: 0, value: 18 }, { timestamp: 2, value: 22 }, { timestamp: 4, value: 24 }]

const res18 = await client.ts.revRange('rg:1', '-', '+', {
  FILTER_BY_TS: [0, 2, 4],
  FILTER_BY_VALUE: { min: 20, max: 25 }
});
console.log(res18);
// >>> [{ timestamp: 4, value: 24 }, { timestamp: 2, value: 22 }]

const res19 = await client.ts.revRange('rg:1', '-', '+', {
  FILTER_BY_TS: [0, 2, 4],
  FILTER_BY_VALUE: { min: 22, max: 22 },
  COUNT: 1
});
console.log(res19);
// >>> [{ timestamp: 2, value: 22 }]
// STEP_END
// REMOVE_START
assert.deepEqual(res17, [
  { timestamp: 0, value: 18 },
  { timestamp: 2, value: 22 },
  { timestamp: 4, value: 24 }
]);
assert.deepEqual(res18, [
  { timestamp: 4, value: 24 },
  { timestamp: 2, value: 22 }
]);
assert.deepEqual(res19, [
  { timestamp: 2, value: 22 }
]);
// REMOVE_END

// STEP_START query_multi
// Create three new "rg:" time series (two in the US
// and one in the UK, with different units) and add some
// data points.
const res20 = await client.ts.create('rg:2', {
  LABELS: { location: 'us', unit: 'cm' }
});
console.log(res20); // >>> OK

const res21 = await client.ts.create('rg:3', {
  LABELS: { location: 'us', unit: 'in' }
});
console.log(res21); // >>> OK

const res22 = await client.ts.create('rg:4', {
  LABELS: { location: 'uk', unit: 'mm' }
});
console.log(res22); // >>> OK

const res23 = await client.ts.mAdd([
  { key: 'rg:2', timestamp: 0, value: 1.8 },
  { key: 'rg:3', timestamp: 0, value: 0.9 },
  { key: 'rg:4', timestamp: 0, value: 25 }
]);
console.log(res23); // >>> [0, 0, 0]

const res24 = await client.ts.mAdd([
  { key: 'rg:2', timestamp: 1, value: 2.1 },
  { key: 'rg:3', timestamp: 1, value: 0.77 },
  { key: 'rg:4', timestamp: 1, value: 18 }
]);
console.log(res24); // >>> [1, 1, 1]

const res25 = await client.ts.mAdd([
  { key: 'rg:2', timestamp: 2, value: 2.3 },
  { key: 'rg:3', timestamp: 2, value: 1.1 },
  { key: 'rg:4', timestamp: 2, value: 21 }
]);
console.log(res25); // >>> [2, 2, 2]

const res26 = await client.ts.mAdd([
  { key: 'rg:2', timestamp: 3, value: 1.9 },
  { key: 'rg:3', timestamp: 3, value: 0.81 },
  { key: 'rg:4', timestamp: 3, value: 19 }
]);
console.log(res26); // >>> [3, 3, 3]

const res27 = await client.ts.mAdd([
  { key: 'rg:2', timestamp: 4, value: 1.78 },
  { key: 'rg:3', timestamp: 4, value: 0.74 },
  { key: 'rg:4', timestamp: 4, value: 23 }
]);
console.log(res27); // >>> [4, 4, 4]

// Retrieve the last data point from each US time series.
const res28 = await client.ts.mGet(['location=us']);
console.log(res28);
// >>> { "rg:2": { sample: { timestamp: 4, value: 1.78 } }, "rg:3": { sample: { timestamp: 4, value: 0.74 } } }

// Retrieve the same data points, but include the `unit`
// label in the results.
const res29 = await client.ts.mGetSelectedLabels(['location=us'], ['unit']);
console.log(res29);
// >>> { "rg:2": { labels: { unit: 'cm' }, sample: { timestamp: 4, value: 1.78 } }, "rg:3": { labels: { unit: 'in' }, sample: { timestamp: 4, value: 0.74 } } }

// Retrieve data points up to time 2 (inclusive) from all
// time series that use millimeters as the unit. Include all
// labels in the results.
const res30 = await client.ts.mRangeWithLabels('-', 2, 'unit=mm');
console.log(res30);
// >>> { "rg:4": { labels: { location: 'uk', unit: 'mm' }, samples: [
//   { timestamp: 0, value: 25 },
//   { timestamp: 1, value: 18 },
//   { timestamp: 2, value: 21 }
// ] } }

// Retrieve data points from time 1 to time 3 (inclusive) from
// all time series that use centimeters or millimeters as the unit,
// but only return the `location` label. Return the results
// in descending order of timestamp.
const res31 = await client.ts.mRevRangeSelectedLabels(
  1, 3,
  ['location'],
  ['unit=(cm,mm)']
);
console.log(res31);
// >>> { "rg:2": { labels: { location: 'us' }, samples: [
//   { timestamp: 3, value: 1.9 },
//   { timestamp: 2, value: 2.3 },
//   { timestamp: 1, value: 2.1 }
// ] }, "rg:4": { labels: { location: 'uk' }, samples: [
//   { timestamp: 3, value: 19 },
//   { timestamp: 2, value: 21 },
//   { timestamp: 1, value: 18 }
// ] } }
// STEP_END
// REMOVE_START
assert.equal(res20, 'OK');
assert.equal(res21, 'OK');
assert.equal(res22, 'OK');
assert.deepEqual(res23, [0, 0, 0]);
assert.deepEqual(res24, [1, 1, 1]);
assert.deepEqual(res25, [2, 2, 2]);
assert.deepEqual(res26, [3, 3, 3]);
assert.deepEqual(res27, [4, 4, 4]);

assert.deepEqual(res28, {
  "rg:2": { sample: { timestamp: 4, value: 1.78 } },
  "rg:3": { sample: { timestamp: 4, value: 0.74 } }
});
assert.deepEqual(res29, {
  "rg:2": { labels: { unit: 'cm' }, sample: { timestamp: 4, value: 1.78 } },
  "rg:3": { labels: { unit: 'in' }, sample: { timestamp: 4, value: 0.74 } }
});

assert.deepEqual(res30, {
  "rg:4": {
    labels: { location: 'uk', unit: 'mm' },
    samples: [
      { timestamp: 0, value: 25 },
      { timestamp: 1, value: 18 },
      { timestamp: 2, value: 21 }
    ]
  }
});
assert.deepEqual(res31, {
  "rg:2": {
    labels: { location: 'us' },
    samples: [
      { timestamp: 3, value: 1.9 },
      { timestamp: 2, value: 2.3 },
      { timestamp: 1, value: 2.1 }
    ]
  },
  "rg:4": {
    labels: { location: 'uk' },
    samples: [
      { timestamp: 3, value: 19 },
      { timestamp: 2, value: 21 },
      { timestamp: 1, value: 18 }
    ]
  }
});
// REMOVE_END

// STEP_START agg
const res32 = await client.ts.range('rg:2', '-', '+', {
  AGGREGATION: {
    type: TIME_SERIES_AGGREGATION_TYPE.AVG,
    timeBucket: 2
  }
});
console.log(res32);
// >>> [{ timestamp: 0, value: 1.9500000000000002 },{ timestamp: 2, value: 2.0999999999999996 }, { timestamp: 4, value: 1.78 }]
// STEP_END
// REMOVE_START
assert.deepEqual(res32, [
  { timestamp: 0, value: 1.9500000000000002 },
  { timestamp: 2, value: 2.0999999999999996 },
  { timestamp: 4, value: 1.78 }
]);
// REMOVE_END

// STEP_START agg_bucket
const res33 = await client.ts.create('sensor3');
console.log(res33); // >>> OK

const res34 = await client.ts.mAdd([
  { key: 'sensor3', timestamp: 10, value: 1000 },
  { key: 'sensor3', timestamp: 20, value: 2000 },
  { key: 'sensor3', timestamp: 30, value: 3000 },
  { key: 'sensor3', timestamp: 40, value: 4000 },
  { key: 'sensor3', timestamp: 50, value: 5000 },
  { key: 'sensor3', timestamp: 60, value: 6000 },
  { key: 'sensor3', timestamp: 70, value: 7000 }
]);
console.log(res34); // >>> [10, 20, 30, 40, 50, 60, 70]

const res35 = await client.ts.range('sensor3', 10, 70, {
  AGGREGATION: {
    type: TIME_SERIES_AGGREGATION_TYPE.MIN,
    timeBucket: 25
  }
});
console.log(res35);
// >>> [{ timestamp: 0, value: 1000 }, { timestamp: 25, value: 3000 }, { timestamp: 50, value: 5000 }]
// STEP_END
// REMOVE_START
assert.equal(res33, 'OK');
assert.deepEqual(res34, [10, 20, 30, 40, 50, 60, 70]);
assert.deepEqual(res35, [
  { timestamp: 0, value: 1000 },
  { timestamp: 25, value: 3000 },
  { timestamp: 50, value: 5000 }
]);
// REMOVE_END

// STEP_START agg_align
const res36 = await client.ts.range('sensor3', 10, 70, {
  AGGREGATION: {
    type: TIME_SERIES_AGGREGATION_TYPE.MIN,
    timeBucket: 25
  },
  ALIGN: 'START'
});
console.log(res36);
// >>> [{ timestamp: 10, value: 1000 }, { timestamp: 35, value: 4000 }, { timestamp: 60, value: 6000 }]
// STEP_END
// REMOVE_START
assert.deepEqual(res36, [
  { timestamp: 10, value: 1000 },
  { timestamp: 35, value: 4000 },
  { timestamp: 60, value: 6000 }
]);
// REMOVE_END

// STEP_START agg_multi
const res37 = await client.ts.create('wind:1', {
  LABELS: { country: 'uk' }
});
console.log(res37); // >>> OK

const res38 = await client.ts.create('wind:2', {
  LABELS: { country: 'uk' }
});
console.log(res38); // >>> OK

const res39 = await client.ts.create('wind:3', {
  LABELS: { country: 'us' }
});
console.log(res39); // >>> OK

const res40 = await client.ts.create('wind:4', {
  LABELS: { country: 'us' }
});
console.log(res40); // >>> OK

const res41 = await client.ts.mAdd([
  { key: 'wind:1', timestamp: 1, value: 12 },
  { key: 'wind:2', timestamp: 1, value: 18 },
  { key: 'wind:3', timestamp: 1, value: 5 },
  { key: 'wind:4', timestamp: 1, value: 20 }
]);
console.log(res41); // >>> [1, 1, 1, 1]

const res42 = await client.ts.mAdd([
  { key: 'wind:1', timestamp: 2, value: 14 },
  { key: 'wind:2', timestamp: 2, value: 21 },
  { key: 'wind:3', timestamp: 2, value: 4 },
  { key: 'wind:4', timestamp: 2, value: 25 }
]);
console.log(res42); // >>> [2, 2, 2, 2]

const res43 = await client.ts.mAdd([
  { key: 'wind:1', timestamp: 3, value: 10 },
  { key: 'wind:2', timestamp: 3, value: 24 },
  { key: 'wind:3', timestamp: 3, value: 8 },
  { key: 'wind:4', timestamp: 3, value: 18 }
]);
console.log(res43); // >>> [3, 3, 3, 3]

// The result pairs contain the timestamp and the maximum sample value
// for the country at that timestamp.
const res44 = await client.ts.mRangeGroupBy(
  '-', '+', ['country=(us,uk)'],
  {label: 'country', REDUCE: TIME_SERIES_REDUCERS.MAX}
);
console.log(res44);
// >>> { "country=uk": { samples: [
//   { timestamp: 1, value: 18 },
//   { timestamp: 2, value: 21 },
//   { timestamp: 3, value: 24 }
// ] }, "country=us": { samples: [
//   { timestamp: 1, value: 20 },
//   { timestamp: 2, value: 25 },
//   { timestamp: 3, value: 18 }
// ] } }

// The result pairs contain the timestamp and the average sample value
// for the country at that timestamp.
const res45 = await client.ts.mRangeGroupBy(
  '-', '+', ['country=(us,uk)'],
  { label: 'country', REDUCE: TIME_SERIES_REDUCERS.AVG}
);
console.log(res45);
// >>> {
// "country=uk": {
//   samples: [{ timestamp: 1, value: 15 }, { timestamp: 2, value: 17.5 }, { timestamp: 3, value: 17 }]
// },
// "country=us": {
//   samples: [{ timestamp: 1, value: 12.5 }, { timestamp: 2, value: 14.5 }, { timestamp: 3, value: 13 }]
// }
// }
// STEP_END
// REMOVE_START
assert.equal(res37, 'OK');
assert.equal(res38, 'OK');
assert.equal(res39, 'OK');
assert.equal(res40, 'OK');
assert.deepEqual(res41, [1, 1, 1, 1]);
assert.deepEqual(res42, [2, 2, 2, 2]);
assert.deepEqual(res43, [3, 3, 3, 3]);

assert.deepEqual(res44, {
  "country=uk": {
    samples: [
      { timestamp: 1, value: 18 },
      { timestamp: 2, value: 21 },
      { timestamp: 3, value: 24 }
    ]
  },
  "country=us": {
    samples: [
      { timestamp: 1, value: 20 },
      { timestamp: 2, value: 25 },
      { timestamp: 3, value: 18 }
    ]
  }
});
assert.deepEqual(res45, {
  "country=uk": {
    samples: [
      { timestamp: 1, value: 15 },
      { timestamp: 2, value: 17.5 },
      { timestamp: 3, value: 17 }
    ]
  },
  "country=us": {
    samples: [
      { timestamp: 1, value: 12.5 },
      { timestamp: 2, value: 14.5 },
      { timestamp: 3, value: 13 }
    ]
  }
});
// REMOVE_END

// STEP_START create_compaction
const res46 = await client.ts.create('hyg:1');
console.log(res46); // >>> OK

const res47 = await client.ts.create('hyg:compacted');
console.log(res47); // >>> OK

const res48 = await client.ts.createRule('hyg:1', 'hyg:compacted', TIME_SERIES_AGGREGATION_TYPE.MIN, 3);
console.log(res48); // >>> OK

const res49 = await client.ts.info('hyg:1');
console.log(res49.rules);
// >>> [{ aggregationType: 'MIN', key: 'hyg:compacted', timeBucket: 3}]

const res50 = await client.ts.info('hyg:compacted');
console.log(res50.sourceKey); // >>> 'hyg:1'
// STEP_END
// REMOVE_START
assert.equal(res46, 'OK');
assert.equal(res47, 'OK');
assert.equal(res48, 'OK');
assert.deepEqual(res49.rules, [
  { aggregationType: 'MIN', key: 'hyg:compacted', timeBucket: 3}
]);
assert.equal(res50.sourceKey, 'hyg:1');
// REMOVE_END

// STEP_START comp_add
const res51 = await client.ts.mAdd([
  { key: 'hyg:1', timestamp: 0, value: 75 },
  { key: 'hyg:1', timestamp: 1, value: 77 },
  { key: 'hyg:1', timestamp: 2, value: 78 }
]);
console.log(res51); // >>> [0, 1, 2]

const res52 = await client.ts.range('hyg:compacted', '-', '+');
console.log(res52); // >>> []

const res53 = await client.ts.add('hyg:1', 3, 79);
console.log(res53); // >>> 3

const res54 = await client.ts.range('hyg:compacted', '-', '+');
console.log(res54); // >>> [{ timestamp: 0, value: 75 }]
// STEP_END
// REMOVE_START
assert.deepEqual(res51, [0, 1, 2]);
assert.deepEqual(res52, []);
assert.equal(res53, 3);
assert.deepEqual(res54, [{ timestamp: 0, value: 75 }]);
// REMOVE_END

// STEP_START del
const res55 = await client.ts.info('thermometer:1');
console.log(res55.totalSamples); // >>> 2
console.log(res55.firstTimestamp); // >>> 1
console.log(res55.lastTimestamp); // >>> 2

const res56 = await client.ts.add('thermometer:1', 3, 9.7);
console.log(res56); // >>> 3

const res57 = await client.ts.info('thermometer:1');
console.log(res57.totalSamples); // >>> 3
console.log(res57.firstTimestamp); // >>> 1
console.log(res57.lastTimestamp); // >>> 3

const res58 = await client.ts.del('thermometer:1', 1, 2);
console.log(res58); // >>> 2

const res59 = await client.ts.info('thermometer:1');
console.log(res59.totalSamples); // >>> 1
console.log(res59.firstTimestamp); // >>> 3
console.log(res59.lastTimestamp); // >>> 3

const res60 = await client.ts.del('thermometer:1', 3, 3);
console.log(res60); // >>> 1

const res61 = await client.ts.info('thermometer:1');
console.log(res61.totalSamples); // >>> 0
// STEP_END
// REMOVE_START
assert.equal(res55.totalSamples, 2);
assert.equal(res55.firstTimestamp, 1);
assert.equal(res55.lastTimestamp, 2);
assert.equal(res56, 3);
assert.equal(res57.totalSamples, 3);
assert.equal(res57.firstTimestamp, 1);
assert.equal(res57.lastTimestamp, 3);
assert.equal(res58, 2);
assert.equal(res59.totalSamples, 1);
assert.equal(res59.firstTimestamp, 3);
assert.equal(res59.lastTimestamp, 3);
assert.equal(res60, 1);
assert.equal(res61.totalSamples, 0);
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END