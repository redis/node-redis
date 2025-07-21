// EXAMPLE: stream_tutorial
// HIDE_START
import assert from 'assert';
import {
  createClient
} from 'redis';

const client = await createClient();
await client.connect();
// HIDE_END
// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START xAdd
const res1 = await client.xAdd(
  'race:france', '*', {
    'rider': 'Castilla',
    'speed': '30.2',
    'position': '1',
    'location_id': '1'
  }
);
console.log(res1); // >>> 1700073067968-0 N.B. actual values will differ from these examples

const res2 = await client.xAdd(
  'race:france', '*', {
    'rider': 'Norem',
    'speed': '28.8',
    'position': '3',
    'location_id': '1'
  },
);
console.log(res2); // >>> 1692629594113-0

const res3 = await client.xAdd(
  'race:france', '*', {
    'rider': 'Prickett',
    'speed': '29.7',
    'position': '2',
    'location_id': '1'
  },
);
console.log(res3); // >>> 1692629613374-0
// STEP_END

// REMOVE_START
assert.equal(await client.xLen('race:france'), 3);
// REMOVE_END

// STEP_START xRange
const res4 = await client.xRange('race:france', '1691765278160-0', '+', {COUNT: 2});
console.log(res4); // >>> [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }, { id: '1692629594113-0', message: { rider: 'Norem', speed: '28.8', position: '3', location_id: '1' } }]
// STEP_END

// STEP_START xread_block
const res5 = await client.xRead({
  key: 'race:france',
  id: '0-0'
}, {
  COUNT: 100,
  BLOCK: 300
});
console.log(res5); // >>> [{ name: 'race:france', messages: [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }, { id: '1692629594113-0', message: { rider: 'Norem', speed: '28.8', position: '3', location_id: '1' } }, { id: '1692629613374-0', message: { rider: 'Prickett', speed: '29.7', position: '2', location_id: '1' } }] }]
// STEP_END

// STEP_START xAdd_2
const res6 = await client.xAdd(
  'race:france', '*', {
    'rider': 'Castilla',
    'speed': '29.9',
    'position': '1',
    'location_id': '2'
  }
);
console.log(res6); // >>> 1692629676124-0
// STEP_END

// STEP_START xlen
const res7 = await client.xLen('race:france');
console.log(res7); // >>> 4
// STEP_END


// STEP_START xAdd_id
const res8 = await client.xAdd('race:usa', '0-1', {
  'racer': 'Castilla'
});
console.log(res8); // >>> 0-1

const res9 = await client.xAdd('race:usa', '0-2', {
  'racer': 'Norem'
});
console.log(res9); // >>> 0-2
// STEP_END

// STEP_START xAdd_bad_id
try {
  const res10 = await client.xAdd('race:usa', '0-1', {
    'racer': 'Prickett'
  });
  console.log(res10); // >>> 0-1
} catch (error) {
  console.error(error); // >>> [SimpleError: ERR The ID specified in XADD is equal or smaller than the target stream top item]
}
// STEP_END

// STEP_START xadd_7
const res11a = await client.xAdd('race:usa', '0-*', { racer: 'Norem' });
console.log(res11a); // >>> 0-3
// STEP_END

// STEP_START xRange_all
const res11 = await client.xRange('race:france', '-', '+');
console.log(res11); // >>> [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }, { id: '1692629594113-0', message: { rider: 'Norem', speed: '28.8', position: '3', location_id: '1' } }, { id: '1692629613374-0', message: { rider: 'Prickett', speed: '29.7', position: '2', location_id: '1' } }, { id: '1692629676124-0', message: { rider: 'Castilla', speed: '29.9', position: '1', location_id: '2' } }]
// STEP_END

// STEP_START xRange_time
const res12 = await client.xRange('race:france', '1692629576965', '1692629576967');
console.log(res12); // >>> [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }]
// STEP_END

// STEP_START xRange_step_1
const res13 = await client.xRange('race:france', '-', '+', {COUNT: 2});
console.log(res13); // >>> [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }, { id: '1692629594113-0', message: { rider: 'Norem', speed: '28.8', position: '3', location_id: '1' } }]
// STEP_END

// STEP_START xRange_step_2
const res14 = await client.xRange('race:france', '(1692629594113-0', '+', {COUNT: 2});
console.log(res14); // >>> [{ id: '1692629613374-0', message: { rider: 'Prickett', speed: '29.7', position: '2', location_id: '1' } }, { id: '1692629676124-0', message: { rider: 'Castilla', speed: '29.9', position: '1', location_id: '2' } }]
// STEP_END

// STEP_START xRange_empty
const res15 = await client.xRange('race:france', '(1692629676124-0', '+', {COUNT: 2});
console.log(res15); // >>> []
// STEP_END

// STEP_START xrevrange
const res16 = await client.xRevRange('race:france', '+', '-', {COUNT: 1});
console.log(
  res16
); // >>> [{ id: '1692629676124-0', message: { rider: 'Castilla', speed: '29.9', position: '1', location_id: '2' } }]
// STEP_END

// STEP_START xread
const res17 = await client.xRead({
  key: 'race:france',
  id: '0-0'
}, {
  COUNT: 2
});
console.log(res17); // >>> [{ name: 'race:france', messages: [{ id: '1692629576966-0', message: { rider: 'Castilla', speed: '30.2', position: '1', location_id: '1' } }, { id: '1692629594113-0', message: { rider: 'Norem', speed: '28.8', position: '3', location_id: '1' } }] }]
// STEP_END

// STEP_START xgroup_create
const res18 = await client.xGroupCreate('race:france', 'france_riders', '$');
console.log(res18); // >>> OK
// STEP_END

// STEP_START xgroup_create_mkstream
const res19 = await client.xGroupCreate('race:italy', 'italy_riders', '$', {
  MKSTREAM: true
});
console.log(res19); // >>> OK
// STEP_END

// STEP_START xgroup_read
await client.xAdd('race:italy', '*', {
  'rider': 'Castilla'
});
await client.xAdd('race:italy', '*', {
  'rider': 'Royce'
});
await client.xAdd('race:italy', '*', {
  'rider': 'Sam-Bodden'
});
await client.xAdd('race:italy', '*', {
  'rider': 'Prickett'
});
await client.xAdd('race:italy', '*', {
  'rider': 'Norem'
});

const res20 = await client.xReadGroup(
  'italy_riders',
  'Alice', {
    key: 'race:italy',
    id: '>'
  }, {
    COUNT: 1
  }
);
console.log(res20); // >>> [{ name: 'race:italy', messages: [{ id: '1692629925771-0', message: { rider: 'Castilla' } }] }]
// STEP_END

// STEP_START xgroup_read_id
const res21 = await client.xReadGroup(
  'italy_riders',
  'Alice', {
    key: 'race:italy',
    id: '0'
  }, {
    COUNT: 1
  }
);
console.log(res21); // >>> [{ name: 'race:italy', messages: [{ id: '1692629925771-0', message: { rider: 'Castilla' } }] }]
// STEP_END

// STEP_START xack
const res22 = await client.xAck('race:italy', 'italy_riders', '1692629925771-0')
console.log(res22); // >>> 1

const res23 = await client.xReadGroup(
  'italy_riders',
  'Alice', {
    key: 'race:italy',
    id: '0'
  }, {
    COUNT: 1
  }
);
console.log(res23); // >>> [{ name: 'race:italy', messages: [] }]
// STEP_END

// STEP_START xgroup_read_bob
const res24 = await client.xReadGroup(
  'italy_riders',
  'Bob', {
    key: 'race:italy',
    id: '>'
  }, {
    COUNT: 2
  }
);
console.log(res24); // >>> [{ name: 'race:italy', messages: [{ id: '1692629925789-0', message: { rider: 'Royce' } }, { id: '1692629925790-0', message: { rider: 'Sam-Bodden' } }] }]
// STEP_END

// STEP_START xpending
const res25 = await client.xPending('race:italy', 'italy_riders');
console.log(res25); // >>> {'pending': 2, 'firstId': '1692629925789-0', 'lastId': '1692629925790-0', 'consumers': [{'name': 'Bob', 'deliveriesCounter': 2}]}
// STEP_END

// STEP_START xpending_plus_minus
const res26 = await client.xPendingRange('race:italy', 'italy_riders', '-', '+', 10);
console.log(res26); // >>> [{'id': '1692629925789-0', 'consumer': 'Bob', 'millisecondsSinceLastDelivery': 31084, 'deliveriesCounter:': 1}, {'id': '1692629925790-0', 'consumer': 'Bob', 'millisecondsSinceLastDelivery': 31084, 'deliveriesCounter': 1}]
// STEP_END

// STEP_START xRange_pending
const res27 = await client.xRange('race:italy', '1692629925789-0', '1692629925789-0');
console.log(res27); // >>> [{ id: '1692629925789-0', message: { rider: 'Royce' } }]
// STEP_END

// STEP_START xclaim
const res28 = await client.xClaim(
  'race:italy', 'italy_riders', 'Alice', 60000, ['1692629925789-0']
);
console.log(res28); // >>> [{ id: '1692629925789-0', message: { rider: 'Royce' } }]
// STEP_END

// STEP_START xautoclaim
const res29 = await client.xAutoClaim('race:italy', 'italy_riders', 'Alice', 1, '0-0', {
  COUNT: 1
});
console.log(res29); // >>> { nextId: '1692629925790-0', messages: [{ id: '1692629925789-0', message: { rider: 'Royce' } }], deletedMessages: [] }
// STEP_END

// STEP_START xautoclaim_cursor
const res30 = await client.xAutoClaim(
  'race:italy', 'italy_riders', 'Alice', 1, '(1692629925789-0',
  {
    COUNT: 1
  }
);
console.log(res30); // >>> { nextId: '0-0', messages: [{ id: '1692629925790-0', message: { rider: 'Sam-Bodden' } }], deletedMessages: [] }
// STEP_END

// STEP_START xinfo
const res31 = await client.xInfoStream('race:italy');
console.log(res31); // >>> { length: 5, 'radix-tree-keys': 1, 'radix-tree-nodes': 2, 'last-generated-id': '1692629926436-0', 'max-deleted-entry-id': '0-0', 'entries-added': 5, 'recorded-first-entry-id': '1692629925771-0', groups: 1, 'first-entry': { id: '1692629925771-0', message: { rider: 'Castilla' } }, 'last-entry': { id: '1692629926436-0', message: { rider: 'Norem' } } }
// STEP_END

// STEP_START xinfo_groups
const res32 = await client.xInfoGroups('race:italy');
console.log(res32); // >>> [{ name: 'italy_riders', consumers: 2, pending: 3, 'last-delivered-id': '1692629925790-0', 'entries-read': 3, lag: 2 }]
// STEP_END

// STEP_START xinfo_consumers
const res33 = await client.xInfoConsumers('race:italy', 'italy_riders');
console.log(res33); // >>> [{ name: 'Alice', pending: 3, idle: 170582, inactive: 170582 }, { name: 'Bob', pending: 0, idle: 489404, inactive: 489404 }]
// STEP_END

// STEP_START maxlen
await client.xAdd('race:italy', '*', {
  'rider': 'Jones'
}, {
  TRIM: {
    strategy: 'MAXLEN',
    strategyModifier: '~',
    threshold: 2
  }
});
await client.xAdd('race:italy', '*', {
  'rider': 'Wood'
}, {
  TRIM: {
    strategy: 'MAXLEN',
    strategyModifier: '~',
    threshold: 2
  }
});
await client.xAdd('race:italy', '*', {
  'rider': 'Henshaw'
}, {
  TRIM: {
    strategy: 'MAXLEN',
    strategyModifier: '~',
    threshold: 2
  }
});

const res34 = await client.xLen('race:italy');
console.log(res34); // >>> 8

const res35 = await client.xRange('race:italy', '-', '+');
console.log(res35); // >>> [{ id: '1692629925771-0', message: { rider: 'Castilla' } }, { id: '1692629925789-0', message: { rider: 'Royce' } }, { id: '1692629925790-0', message: { rider: 'Sam-Bodden' } }, { id: '1692629925791-0', message: { rider: 'Prickett' } }, { id: '1692629926436-0', message: { rider: 'Norem' } }, { id: '1692630612602-0', message: { rider: 'Jones' } }, { id: '1692630641947-0', message: { rider: 'Wood' } }, { id: '1692630648281-0', message: { rider: 'Henshaw' } }]

await client.xAdd('race:italy', '*', {
  'rider': 'Smith'
}, {
  TRIM: {
    strategy: 'MAXLEN',
    strategyModifier: '=',
    threshold: 2
  }
});

const res36 = await client.xRange('race:italy', '-', '+');
console.log(res36); // >>> [{ id: '1692630648281-0', message: { rider: 'Henshaw' } }, { id: '1692631018238-0', message: { rider: 'Smith' } }]
// STEP_END

// STEP_START xTrim
const res37 = await client.xTrim('race:italy', 'MAXLEN', 10, {
  strategyModifier: '=',
});
console.log(res37); // >>> 0
// STEP_END

// STEP_START xTrim2
const res38 = await client.xTrim('race:italy', "MAXLEN", 10);
console.log(res38); // >>> 0
// STEP_END

// STEP_START xDel
const res39 = await client.xRange('race:italy', '-', '+');
console.log(res39); // >>> [{ id: '1692630648281-0', message: { rider: 'Henshaw' } }, { id: '1692631018238-0', message: { rider: 'Smith' } }]

const res40 = await client.xDel('race:italy', '1692631018238-0');
console.log(res40); // >>> 1

const res41 = await client.xRange('race:italy', '-', '+');
console.log(res41); // >>> [{ id: '1692630648281-0', message: { rider: 'Henshaw' } }]
// STEP_END

// REMOVE_START
await client.quit();
// REMOVE_END